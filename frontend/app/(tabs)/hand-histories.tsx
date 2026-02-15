import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus, Share } from 'react-native';
import { File as ExpoFile, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { PokerTable, SeatData } from '../../components/replayer/PokerTable';
import { SeatModal } from '../../components/replayer/SeatModal';
import { ActionButtons, ActionType } from '../../components/replayer/ActionButtons';
import { ActionRecord, Street, PotInfo } from '../../components/replayer/ActionHistory';
import { ActionHistoryModal } from '../../components/replayer/ActionHistoryModal';
import { PlaybackControls } from '../../components/replayer/PlaybackControls';
import { NotesModal } from '../../components/replayer/NotesModal';
import { BetSizingModal } from '../../components/replayer/BetSizingModal';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/ui/ToastProvider';
import { formatHandHistory } from '../../components/replayer/handHistoryFormatter';

// Position labels per table size (clockwise from BTN)
const POSITION_MAP: Record<number, string[]> = {
    9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO'],
    8: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'LJ', 'HJ', 'CO'],
    7: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'HJ', 'CO'],
    6: ['BTN', 'SB', 'BB', 'UTG', 'HJ', 'CO'],
    5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
    4: ['BTN', 'SB', 'BB', 'CO'],
    3: ['BTN', 'SB', 'BB'],
};

function makeDefaultSeats(tableSize: number, sb: number, bb: number): SeatData[] {
    const positions = POSITION_MAP[tableSize] || POSITION_MAP[9];
    return positions.map((pos) => ({
        position: pos,
        stack: pos === 'SB' ? 1000 - sb : pos === 'BB' ? 1000 - bb : 1000,
        cards: [],
        isHero: false,
        isDealer: pos === 'BTN',
        isFolded: false,
        isActive: true,
        isAllIn: false,
        currentBet: pos === 'SB' ? sb : pos === 'BB' ? bb : 0,
    }));
}

function parseStakes(stakes: string): { sb: number; bb: number } {
    const match = stakes.replace(/\$/g, '').match(/(\d+)\/(\d+)/);
    if (match) return { sb: parseInt(match[1]), bb: parseInt(match[2]) };
    return { sb: 5, bb: 10 };
}

// Preflop action starts at the first seat after BB (UTG)
function getInitialActiveIndex(tableSize: number): number {
    return 3 % tableSize;
}

// Postflop action starts at first non-folded, non-all-in seat after dealer (SB or next)
function getPostflopFirstActor(seats: SeatData[], tableSize: number): number {
    // Dealer is at index 0 (BTN). SB=1, BB=2, etc.
    for (let i = 1; i < tableSize; i++) {
        const idx = i % tableSize;
        if (!seats[idx].isFolded && !seats[idx].isAllIn) return idx;
    }
    // Everyone is folded or all-in — return 0 as fallback
    return 0;
}

const NEXT_STREET: Record<Street, Street> = {
    preflop: 'flop',
    flop: 'turn',
    turn: 'river',
    river: 'showdown',
    showdown: 'showdown',
};

// Calculate side pots from per-seat total bets this street.
// In heads-up (2 non-folded players), no side pot is created — excess returns to bigger stack.
// Side pots only apply with 3+ non-folded players when someone is all-in for less.
// Returns: { pots, excessReturn: { seatIndex, amount } | null }
function calculateSidePots(seats: SeatData[]): {
    pots: PotInfo[];
    excessReturn: { seatIndex: number; amount: number } | null;
} {
    const nonFolded = seats
        .map((s, i) => ({ index: i, bet: s.currentBet, folded: s.isFolded, isAllIn: s.isAllIn }))
        .filter(b => !b.folded);

    // Gather bets from non-folded seats that have bet something
    const bettors = nonFolded.filter(b => b.bet > 0);

    if (bettors.length === 0) return { pots: [], excessReturn: null };

    // --- HU all-in: no side pots, excess returns to bigger stack ---
    if (nonFolded.length === 2) {
        const hasAllIn = nonFolded.some(b => b.isAllIn);
        if (hasAllIn) {
            const effectiveStack = Math.min(...bettors.map(b => b.bet));
            const mainPotAmount = effectiveStack * bettors.length;
            const eligible = bettors.map(b => b.index);
            // Find the player who bet more and calculate excess
            const bigBettor = bettors.find(b => b.bet > effectiveStack);
            const excessReturn = bigBettor
                ? { seatIndex: bigBettor.index, amount: bigBettor.bet - effectiveStack }
                : null;
            return {
                pots: [{ amount: mainPotAmount, eligible }],
                excessReturn,
            };
        }
    }

    // --- 3+ players: standard side pot calculation ---
    const allInLevels = nonFolded
        .filter(b => b.isAllIn && b.bet > 0)
        .map(b => b.bet)
        .sort((a, b) => a - b);

    const maxBet = Math.max(...bettors.map(b => b.bet));
    const levels = [...new Set([...allInLevels, maxBet])].sort((a, b) => a - b);

    const pots: PotInfo[] = [];
    let prevLevel = 0;
    let excessReturn: { seatIndex: number; amount: number } | null = null;

    for (const level of levels) {
        const slice = level - prevLevel;
        if (slice <= 0) continue;

        const eligible: number[] = [];
        let potAmount = 0;
        for (const b of bettors) {
            if (b.bet >= level && !b.folded) {
                eligible.push(b.index);
            }
            const contribution = Math.min(Math.max(b.bet - prevLevel, 0), slice);
            potAmount += contribution;
        }

        if (potAmount > 0) {
            // If only 1 player is eligible, this isn't a real pot — return it to them
            if (eligible.length === 1) {
                excessReturn = { seatIndex: eligible[0], amount: potAmount };
            } else {
                pots.push({ amount: potAmount, eligible });
            }
        }
        prevLevel = level;
    }

    return { pots, excessReturn };
}

export default function HandHistoriesScreen() {
    // Table size
    const [tableSize, setTableSize] = useState(9);

    const [stakes, setStakes] = useState('$5/$10');
    const { sb, bb } = parseStakes(stakes);

    // Seats state
    const [seats, setSeats] = useState<SeatData[]>(makeDefaultSeats(9, 5, 10));
    const [communityCards, setCommunityCards] = useState<string[]>(['', '', '', '', '']);
    const [pot, setPot] = useState(0); // collected pot (blinds tracked in currentBet)
    const [pots, setPots] = useState<PotInfo[]>([]); // side pots (empty = single pot)
    const [currentStreet, setCurrentStreet] = useState<Street>('preflop');
    // Last aggressor: seat index that made the last bet/raise. Preflop: BB (index 2).
    const [lastAggressorIndex, setLastAggressorIndex] = useState<number | null>(null);
    // Whether we're waiting for community cards before action can continue
    const [waitingForBoard, setWaitingForBoard] = useState(false);

    // Seat Modal state
    const [seatModalVisible, setSeatModalVisible] = useState(false);
    const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
    const [isBoardMode, setIsBoardMode] = useState(false);
    const [currentBoardSlot, setCurrentBoardSlot] = useState<number | null>(null);

    // Used cards tracking (card string -> owner label)
    const [usedCards, setUsedCards] = useState<Record<string, string>>({});

    // Action history & notes
    const [actions, setActions] = useState<ActionRecord[]>([]);
    const [redoStack, setRedoStack] = useState<ActionRecord[]>([]);
    const [notes, setNotes] = useState('');

    // Display toggles & modals
    const [showCards, setShowCards] = useState(true);
    const [displayMode, setDisplayMode] = useState<'money' | 'bb'>('money');
    const [historyModalVisible, setHistoryModalVisible] = useState(false);
    const [notesModalVisible, setNotesModalVisible] = useState(false);

    // Active seat for actions — starts at UTG (first after BB)
    const [activeSeatIndex, setActiveSeatIndex] = useState(getInitialActiveIndex(9));
    const { showToast } = useToast();

    // Bet sizing modal state
    const [betSizingVisible, setBetSizingVisible] = useState(false);
    const [pendingBetAction, setPendingBetAction] = useState<'bet' | 'raise'>('bet');
    const pendingSeatIndexRef = useRef(0); // Captures activeSeatIndex when raise modal opens

    // Playback animation state
    const [isPlaying, setIsPlaying] = useState(false);
    const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const playbackActionsRef = useRef<ActionRecord[]>([]);
    const playbackStepRef = useRef(0);

    // Close all modals when the app goes to background (passcode activates)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'background' || nextState === 'inactive') {
                setSeatModalVisible(false);
                setHistoryModalVisible(false);
                setNotesModalVisible(false);
                setBetSizingVisible(false);
            }
        });
        return () => subscription.remove();
    }, []);

    // --- Facing bet logic ---
    // The highest currentBet among non-folded seats
    const facingBet = useMemo(() => {
        return Math.max(...seats.filter(s => !s.isFolded).map(s => s.currentBet));
    }, [seats]);

    const activeSeat = seats[activeSeatIndex];
    const canCheck = activeSeat ? activeSeat.currentBet >= facingBet : false;
    const canCall = activeSeat ? activeSeat.currentBet < facingBet : false;
    const callAmount = canCall ? facingBet - (activeSeat?.currentBet || 0) : 0;
    const canBet = canCheck && facingBet === 0; // no bet yet (postflop)
    // canRaise: there's a facing bet OR we're preflop (blinds count)
    const canRaise = canCall || (canCheck && facingBet > 0);

    // All-in state: disable actions when all non-folded players are all-in
    // (or only 1 active player remains and rest are all-in)
    const allPlayersAllIn = useMemo(() => {
        const nonFolded = seats.filter(s => !s.isFolded);
        const active = nonFolded.filter(s => !s.isAllIn);
        return active.length === 0 && nonFolded.length > 1;
    }, [seats]);

    // Combined disabled flag for action buttons
    const actionsDisabled = waitingForBoard || allPlayersAllIn || currentStreet === 'showdown' || isPlaying;

    // --- Table Size Stepper ---

    const handleTableSizeChange = useCallback((delta: number) => {
        setTableSize(prev => {
            const next = Math.max(3, Math.min(9, prev + delta));
            if (next !== prev) {
                const { sb: newSb, bb: newBb } = parseStakes(stakes);
                setSeats(makeDefaultSeats(next, newSb, newBb));
                setActions([]);
                setActiveSeatIndex(getInitialActiveIndex(next));
                setUsedCards({});
                setCommunityCards(['', '', '', '', '']);
                setPot(0);
                setPots([]);
                setCurrentStreet('preflop');
                setLastAggressorIndex(null);
                setWaitingForBoard(false);
                setRedoStack([]);
            }
            return next;
        });
    }, [stakes]);

    // --- Handlers ---

    const handlePressSeat = useCallback((seatIndex: number) => {
        setSelectedSeatIndex(seatIndex);
        setIsBoardMode(false);
        setCurrentBoardSlot(null);
        setSeatModalVisible(true);
    }, []);

    const handlePressBoardSlot = useCallback((slotIndex: number) => {
        setCurrentBoardSlot(slotIndex);
        setIsBoardMode(true);
        setSelectedSeatIndex(null);
        setSeatModalVisible(true);
    }, []);

    // Remove a board card (tap filled card in modal header to replace it)
    const handleBoardCardRemove = useCallback((slotIndex: number) => {
        const cardToRemove = communityCards[slotIndex];
        if (cardToRemove) {
            // Clear the card from community cards
            setCommunityCards(prev => {
                const next = [...prev];
                next[slotIndex] = '';
                return next;
            });
            // Free it from usedCards
            setUsedCards(prev => {
                const next = { ...prev };
                delete next[cardToRemove];
                return next;
            });
        }
        // Switch active slot to the cleared slot
        setCurrentBoardSlot(slotIndex);
    }, [communityCards]);

    // Switch active board slot (tap empty slot in modal header)
    const handleBoardSlotSelect = useCallback((slotIndex: number) => {
        setCurrentBoardSlot(slotIndex);
    }, []);

    const handleSeatModalClose = useCallback((newStack?: number) => {
        if (selectedSeatIndex !== null && newStack !== undefined) {
            setSeats(prev => {
                const next = [...prev];
                next[selectedSeatIndex] = { ...next[selectedSeatIndex], stack: newStack };
                return next;
            });
        }
        setSeatModalVisible(false);
        setSelectedSeatIndex(null);
        setCurrentBoardSlot(null);
        setIsBoardMode(false);
    }, [selectedSeatIndex]);

    const handleCardAssigned = useCallback((card: string) => {
        if (isBoardMode && currentBoardSlot !== null) {
            // Board card mode
            setCommunityCards(prev => {
                const next = [...prev];
                next[currentBoardSlot] = card;
                return next;
            });
            setUsedCards(prev => ({ ...prev, [card]: 'Board' }));

            // Determine which street's slots we're filling
            // Flop = 0,1,2; Turn = 3; River = 4
            const streetEnd = currentBoardSlot < 3 ? 2 : currentBoardSlot; // flop ends at 2, turn/river at their slot

            // Auto-advance to next empty slot within this street's range
            const nextEmpty = communityCards.findIndex((c, i) => i > currentBoardSlot && i <= streetEnd && !c);
            if (nextEmpty !== -1) {
                setCurrentBoardSlot(nextEmpty);
            } else {
                // This street's cards are filled — close modal and resume action
                setSeatModalVisible(false);
                setCurrentBoardSlot(null);
                setIsBoardMode(false);
                setWaitingForBoard(false);
            }
        } else if (selectedSeatIndex !== null) {
            // Seat hole card mode
            setSeats(prev => {
                const next = [...prev];
                const seat = next[selectedSeatIndex];
                const existingCards = [...seat.cards];
                if (existingCards.length < 2) {
                    existingCards.push(card);
                }
                next[selectedSeatIndex] = { ...seat, cards: existingCards };
                return next;
            });
            setUsedCards(prev => ({ ...prev, [card]: seats[selectedSeatIndex].position }));
        }
    }, [isBoardMode, currentBoardSlot, selectedSeatIndex, communityCards, seats]);

    // --- Hero Seat Rotation (ported from index.html selectHeroSeat) ---
    const handleHero = useCallback(() => {
        if (selectedSeatIndex === null) return;

        const positions = POSITION_MAP[tableSize] || POSITION_MAP[9];
        const clickedLabel = seats[selectedSeatIndex].position;
        const clickedLabelIndex = positions.indexOf(clickedLabel);

        if (actions.length === 0) {
            // === FRESH HAND (setup mode) ===
            // Full reset: rotate positions, set blinds, reset stacks
            setSeats(prev => {
                return prev.map((seat, seatIndex) => {
                    const labelIndex = ((clickedLabelIndex + seatIndex) % tableSize + tableSize) % tableSize;
                    const newPosition = positions[labelIndex];
                    const newBet = newPosition === 'SB' ? sb : newPosition === 'BB' ? bb : 0;
                    return {
                        ...seat,
                        position: newPosition,
                        isHero: seatIndex === 0,
                        isDealer: newPosition === 'BTN',
                        currentBet: newBet,
                        stack: seat.cards.length > 0 ? seat.stack : 1000 - newBet,
                        isAllIn: false,
                    };
                });
            });
            // Reset active seat to UTG
            const utgLabelIndex = 3;
            const utgSeatIndex = ((utgLabelIndex - clickedLabelIndex) % tableSize + tableSize) % tableSize;
            setActiveSeatIndex(utgSeatIndex);
            setLastAggressorIndex(utgSeatIndex);
        } else {
            // === MID-HAND (non-destructive) ===
            // Only rotate position labels and set Hero/Dealer flags.
            // Preserve currentBet, stack, isAllIn, isFolded — game state stays intact.
            setSeats(prev => {
                return prev.map((seat, seatIndex) => {
                    const labelIndex = ((clickedLabelIndex + seatIndex) % tableSize + tableSize) % tableSize;
                    const newPosition = positions[labelIndex];
                    return {
                        ...seat,
                        position: newPosition,
                        isHero: seatIndex === 0,
                        isDealer: newPosition === 'BTN',
                    };
                });
            });
        }

    }, [selectedSeatIndex, seats, tableSize, showToast, sb, bb, actions]);

    // Helper: advance to next non-folded, non-all-in seat
    // Also detects street end and handles pot collection + street transition
    // Accepts explicit params to avoid stale React closure values
    const advanceSeat = useCallback((updatedSeats?: SeatData[], fromSeatIndex?: number, aggressorIndex?: number) => {
        const seatsNow = updatedSeats || seats;
        const currentActive = fromSeatIndex ?? activeSeatIndex;
        const currentAggressor = aggressorIndex ?? lastAggressorIndex;

        const activePlayers = seatsNow.filter(s => !s.isFolded && !s.isAllIn);
        const nonFoldedPlayers = seatsNow.filter(s => !s.isFolded);

        // Hand over: only 1 non-folded player
        if (nonFoldedPlayers.length <= 1) {
            setCurrentStreet('showdown');
            return;
        }

        // Find next seat that can act (starting from the seat AFTER currentActive)
        let nextIndex = (currentActive + 1) % tableSize;
        let attempts = 0;
        while ((seatsNow[nextIndex].isFolded || seatsNow[nextIndex].isAllIn) && attempts < tableSize) {
            nextIndex = (nextIndex + 1) % tableSize;
            attempts++;
        }

        // All active players all-in: collect and advance street
        if (activePlayers.length === 0 && nonFoldedPlayers.length > 1) {
            collectAndAdvance(seatsNow);
            return;
        }

        // Street closing: if next to act is the last aggressor AND all bets are matched
        // This means everyone has had a chance to act since the last raise
        if (currentAggressor !== null && nextIndex === currentAggressor) {
            const highBet = Math.max(...nonFoldedPlayers.map(s => s.currentBet));
            const allMatched = activePlayers.every(s => s.currentBet === highBet);
            if (allMatched) {
                collectAndAdvance(seatsNow);
                return;
            }
        }

        setActiveSeatIndex(nextIndex);
    }, [activeSeatIndex, seats, tableSize, lastAggressorIndex]);

    // Collect bets from current street and advance to next
    const collectAndAdvance = useCallback((seatsNow: SeatData[]) => {
        const totalCollected = seatsNow.reduce((sum, s) => sum + s.currentBet, 0);
        const newSeats = seatsNow.map(s => ({ ...s, currentBet: 0 }));
        let adjustedTotal = totalCollected;

        // Only calculate side pots when someone is actually all-in
        const hasAllIn = seatsNow.some(s => !s.isFolded && s.isAllIn);
        if (hasAllIn) {
            const { pots: sidePots, excessReturn } = calculateSidePots(seatsNow);
            // In HU all-in, return excess chips to the bigger stack
            if (excessReturn) {
                newSeats[excessReturn.seatIndex] = {
                    ...newSeats[excessReturn.seatIndex],
                    stack: newSeats[excessReturn.seatIndex].stack + excessReturn.amount,
                };
                adjustedTotal -= excessReturn.amount;
            }
            if (sidePots.length > 0) {
                setPots(prev => [...prev, ...sidePots]);
            }
        }

        setSeats(newSeats);
        setPot(prev => prev + adjustedTotal);
        setCurrentStreet(prev => NEXT_STREET[prev]);
        // Set first actor as default aggressor so check-arounds close the street
        const firstActor = getPostflopFirstActor(newSeats, tableSize);
        setLastAggressorIndex(firstActor);
        setActiveSeatIndex(firstActor);

        // Auto-open board modal for the next street's community cards
        // Flop = slots 0,1,2; Turn = slot 3; River = slot 4
        const nextStreet = NEXT_STREET[currentStreet];
        const boardSlot = nextStreet === 'flop' ? 0 : nextStreet === 'turn' ? 3 : nextStreet === 'river' ? 4 : null;
        if (boardSlot !== null) {
            setWaitingForBoard(true);
            setCurrentBoardSlot(boardSlot);
            setIsBoardMode(true);
            setSelectedSeatIndex(null);
            setSeatModalVisible(true);
        }
    }, [tableSize, currentStreet]);

    // Auto-advance streets when all players are all-in and board cards were just dealt
    // Flow: all-in → board modal → pick cards → waitingForBoard becomes false → auto-advance
    useEffect(() => {
        if (!waitingForBoard && allPlayersAllIn && currentStreet !== 'preflop' && currentStreet !== 'showdown') {
            // Small delay to let the UI update before advancing
            const timer = setTimeout(() => {
                collectAndAdvance(seats);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [waitingForBoard, allPlayersAllIn, currentStreet]);

    // Create state snapshot for undo
    const makeSnapshot = useCallback(() => ({
        seats: seats.map(s => ({ ...s })),
        pot,
        pots: pots.map(p => ({ ...p, eligible: [...p.eligible] })),
        activeSeatIndex,
        currentStreet,
        lastAggressorIndex,
        communityCards: [...communityCards],
        waitingForBoard,
    }), [seats, pot, pots, activeSeatIndex, currentStreet, lastAggressorIndex, communityCards, waitingForBoard]);

    const handleAction = useCallback((actionType: ActionType) => {
        const seat = seats[activeSeatIndex];
        const snapshot = makeSnapshot();

        if (actionType === 'bet' || actionType === 'raise') {
            setPendingBetAction(actionType === 'bet' ? 'bet' : 'raise');
            pendingSeatIndexRef.current = activeSeatIndex; // Freeze the seat index
            setBetSizingVisible(true);
            return;
        }

        if (actionType === 'fold') {
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: 'fold',
                street: currentStreet,
                prevState: snapshot,
            };
            setActions(prev => [...prev, record]);
            setRedoStack([]);
            const newSeats = [...seats];
            newSeats[activeSeatIndex] = { ...newSeats[activeSeatIndex], isFolded: true };
            setSeats(newSeats);
            advanceSeat(newSeats, activeSeatIndex);
            return;
        }

        if (actionType === 'call') {
            let toCall = facingBet - seat.currentBet;
            let isAllIn = false;
            // Stack restriction: can't call more than stack
            if (toCall >= seat.stack) {
                toCall = seat.stack;
                isAllIn = true;
            }
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: isAllIn ? 'all-in' : 'call',
                amount: toCall,
                street: currentStreet,
                prevState: snapshot,
            };
            setActions(prev => [...prev, record]);
            setRedoStack([]);
            const newSeats = [...seats];
            newSeats[activeSeatIndex] = {
                ...newSeats[activeSeatIndex],
                currentBet: seat.currentBet + toCall,
                stack: seat.stack - toCall,
                isAllIn,
            };
            setSeats(newSeats);
            advanceSeat(newSeats, activeSeatIndex);
            return;
        }

        if (actionType === 'check') {
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: 'check',
                street: currentStreet,
                prevState: snapshot,
            };
            setActions(prev => [...prev, record]);
            setRedoStack([]);
            advanceSeat();
            return;
        }
    }, [activeSeatIndex, seats, tableSize, facingBet, advanceSeat, makeSnapshot]);

    // Bet/Raise confirmed from modal
    const handleBetConfirm = useCallback((amount: number) => {
        setBetSizingVisible(false);
        const seatIdx = pendingSeatIndexRef.current; // Use frozen seat index
        const seat = seats[seatIdx];
        const snapshot = makeSnapshot();
        const additionalCost = amount - seat.currentBet;
        const isAllIn = additionalCost >= seat.stack;
        const actualCost = Math.min(additionalCost, seat.stack);
        const actualBet = seat.currentBet + actualCost;

        const record: ActionRecord = {
            id: `${Date.now()}-${Math.random()}`,
            player: seat.position,
            action: isAllIn ? 'all-in' : pendingBetAction,
            amount: actualBet,
            street: currentStreet,
            prevState: snapshot,
        };
        setActions(prev => [...prev, record]);
        setRedoStack([]);
        const newSeats = [...seats];
        newSeats[seatIdx] = {
            ...newSeats[seatIdx],
            currentBet: actualBet,
            stack: seat.stack - actualCost,
            isAllIn,
        };
        setSeats(newSeats);
        // Bet/raise = aggressive action → set last aggressor
        setLastAggressorIndex(seatIdx);
        advanceSeat(newSeats, seatIdx, seatIdx);
    }, [seats, pendingBetAction, advanceSeat, makeSnapshot]);

    const handleBetCancel = useCallback(() => {
        setBetSizingVisible(false);
    }, []);

    const handleShare = useCallback(async () => {
        if (actions.length === 0) {
            showToast('No actions to share', 'info');
            return;
        }

        const { sb: curSb, bb: curBb } = parseStakes(stakes);
        const hhText = formatHandHistory({
            seats,
            actions,
            communityCards,
            stakes,
            tableSize,
            pot,
            pots,
            sb: curSb,
            bb: curBb,
        });

        try {
            // Write HH to a .txt file and share it (SDK 54 File API)
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `hand_history_${timestamp}.txt`;
            const file = new ExpoFile(Paths.cache, fileName);

            file.write(hhText);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(file.uri, {
                    mimeType: 'text/plain',
                    dialogTitle: 'Share Hand History',
                    UTI: 'public.plain-text',
                });
                showToast('Hand history shared', 'success');
            } else {
                // Fallback: share as raw text if file sharing unavailable
                await Share.share({ message: hhText, title: 'Hand History' });
                showToast('Hand history shared as text', 'success');
            }
        } catch (error: any) {
            if (error?.message?.includes('cancel')) {
                showToast('Share cancelled', 'info');
            } else {
                console.error('Share error:', error);
                // Fallback to raw text share
                try {
                    await Share.share({ message: hhText, title: 'Hand History' });
                    showToast('Shared as text (file sharing unavailable)', 'info');
                } catch {
                    showToast('Share failed', 'error');
                }
            }
        }
    }, [actions, seats, communityCards, stakes, tableSize, pot, pots, showToast]);

    const stopPlayback = useCallback(() => {
        if (playIntervalRef.current) {
            clearInterval(playIntervalRef.current);
            playIntervalRef.current = null;
        }
        setIsPlaying(false);
    }, []);

    const handlePlay = useCallback(() => {
        // If already playing, pause/stop
        if (isPlaying) {
            stopPlayback();
            return;
        }

        if (actions.length === 0) {
            showToast('No actions to replay', 'info');
            return;
        }

        // Check that first action has prevState (needed for rewind)
        if (!actions[0].prevState) {
            showToast('Cannot replay: missing state snapshots', 'info');
            return;
        }

        // Save the full action list for playback
        const allActions = [...actions];
        playbackActionsRef.current = allActions;
        playbackStepRef.current = 0;

        // Save current (final) state so we can restore it after the last action
        const finalState = {
            seats: [...seats],
            pot,
            pots: [...pots],
            activeSeatIndex,
            currentStreet,
            lastAggressorIndex,
            communityCards: [...communityCards],
            waitingForBoard,
        };

        // Rewind to initial state (before first action)
        const initialState = allActions[0].prevState!;
        setSeats(initialState.seats);
        setPot(initialState.pot);
        setPots(initialState.pots);
        setActiveSeatIndex(initialState.activeSeatIndex);
        setCurrentStreet(initialState.currentStreet);
        setLastAggressorIndex(initialState.lastAggressorIndex);
        setCommunityCards(initialState.communityCards);
        setWaitingForBoard(initialState.waitingForBoard);
        setActions([]);
        setRedoStack([]);

        setIsPlaying(true);

        // Step through actions at 800ms intervals
        playIntervalRef.current = setInterval(() => {
            const step = playbackStepRef.current;
            const actionsQueue = playbackActionsRef.current;

            if (step >= actionsQueue.length) {
                // Playback complete — stop
                clearInterval(playIntervalRef.current!);
                playIntervalRef.current = null;
                setIsPlaying(false);
                return;
            }

            // Determine the state AFTER this action
            const nextStep = step + 1;

            if (nextStep < actionsQueue.length && actionsQueue[nextStep].prevState) {
                // The state after this action = the prevState of the next action
                const afterState = actionsQueue[nextStep].prevState!;
                setSeats(afterState.seats);
                setPot(afterState.pot);
                setPots(afterState.pots);
                setActiveSeatIndex(afterState.activeSeatIndex);
                setCurrentStreet(afterState.currentStreet);
                setLastAggressorIndex(afterState.lastAggressorIndex);
                setCommunityCards(afterState.communityCards);
                setWaitingForBoard(afterState.waitingForBoard);
            } else {
                // Last action — restore the saved final state
                setSeats(finalState.seats);
                setPot(finalState.pot);
                setPots(finalState.pots);
                setActiveSeatIndex(finalState.activeSeatIndex);
                setCurrentStreet(finalState.currentStreet);
                setLastAggressorIndex(finalState.lastAggressorIndex);
                setCommunityCards(finalState.communityCards);
                setWaitingForBoard(finalState.waitingForBoard);
            }

            // Add this action to the visible action history
            setActions(prev => [...prev, actionsQueue[step]]);

            playbackStepRef.current = nextStep;
        }, 800);
    }, [isPlaying, actions, seats, pot, pots, activeSeatIndex, currentStreet, lastAggressorIndex, communityCards, waitingForBoard, stopPlayback, showToast]);

    const handleNewHand = useCallback(() => {
        const { sb: curSb, bb: curBb } = parseStakes(stakes);
        setSeats(makeDefaultSeats(tableSize, curSb, curBb));
        setActions([]);
        setActiveSeatIndex(getInitialActiveIndex(tableSize));
        setUsedCards({});
        setCommunityCards(['', '', '', '', '']);
        setPot(0);
        setPots([]);
        setCurrentStreet('preflop');
        setLastAggressorIndex(null);
        setRedoStack([]);
        setWaitingForBoard(false);
    }, [stakes, tableSize]);

    const handlePrev = useCallback(() => {
        if (actions.length === 0) return;
        const lastAction = actions[actions.length - 1];
        setActions(prev => prev.slice(0, -1));
        setRedoStack(prev => [...prev, lastAction]); // push to redo

        // Snapshot-based undo: restore entire previous state
        if (lastAction.prevState) {
            setSeats(lastAction.prevState.seats);
            setPot(lastAction.prevState.pot);
            setPots(lastAction.prevState.pots);
            setActiveSeatIndex(lastAction.prevState.activeSeatIndex);
            setCurrentStreet(lastAction.prevState.currentStreet);
            setLastAggressorIndex(lastAction.prevState.lastAggressorIndex);
            setCommunityCards(lastAction.prevState.communityCards);
            setWaitingForBoard(lastAction.prevState.waitingForBoard);
            return;
        }

        // Fallback for old actions without snapshots
        const seatIdx = seats.findIndex(s => s.position === lastAction.player);
        if (seatIdx === -1) return;
        setActiveSeatIndex(seatIdx);
        if (lastAction.action === 'fold') {
            setSeats(prev => {
                const next = [...prev];
                next[seatIdx] = { ...next[seatIdx], isFolded: false };
                return next;
            });
        }
    }, [actions, seats]);

    const handleNext = useCallback(() => {
        if (redoStack.length === 0) return;
        const action = redoStack[redoStack.length - 1];
        setRedoStack(prev => prev.slice(0, -1));
        setActions(prev => [...prev, action]);

        // Re-apply the action by looking at current state + action details
        // Since the action's prevState IS our current state, we can derive the result
        // Simply: apply the action effect
        const seatIdx = seats.findIndex(s => s.position === action.player);
        if (seatIdx === -1) return;

        if (action.action === 'fold') {
            const newSeats = [...seats];
            newSeats[seatIdx] = { ...newSeats[seatIdx], isFolded: true };
            setSeats(newSeats);
            advanceSeat(newSeats, seatIdx);
        } else if (action.action === 'check') {
            advanceSeat(undefined, seatIdx);
        } else if (action.action === 'call' && action.amount) {
            const newSeats = [...seats];
            newSeats[seatIdx] = {
                ...newSeats[seatIdx],
                currentBet: seats[seatIdx].currentBet + action.amount,
                stack: seats[seatIdx].stack - action.amount,
            };
            setSeats(newSeats);
            advanceSeat(newSeats, seatIdx);
        } else if ((action.action === 'bet' || action.action === 'raise' || action.action === 'all-in') && action.amount) {
            const additionalCost = action.amount - seats[seatIdx].currentBet;
            const actualCost = Math.min(additionalCost, seats[seatIdx].stack);
            const isAllIn = actualCost >= seats[seatIdx].stack;
            const newSeats = [...seats];
            newSeats[seatIdx] = {
                ...newSeats[seatIdx],
                currentBet: action.amount,
                stack: seats[seatIdx].stack - actualCost,
                isAllIn,
            };
            setSeats(newSeats);
            setLastAggressorIndex(seatIdx);
            advanceSeat(newSeats, seatIdx, seatIdx);
        }
    }, [redoStack, seats, advanceSeat]);

    const modalPosition = isBoardMode
        ? 'Board'
        : selectedSeatIndex !== null
            ? seats[selectedSeatIndex].position
            : '--';

    const modalStack = selectedSeatIndex !== null ? seats[selectedSeatIndex].stack : 1000;

    return (
        <ScreenWrapper hideHeader>
            <View style={styles.container}>

                {/* New Hand — top right corner */}
                <TouchableOpacity
                    style={styles.newHandBtn}
                    onPress={handleNewHand}
                    activeOpacity={0.6}
                >
                    <Ionicons name="refresh-outline" size={18} color="#fff" />
                </TouchableOpacity>

                {/* Poker Table — fills available space */}
                <View style={styles.tableContainer}>
                    <PokerTable
                        seats={seats}
                        communityCards={communityCards}
                        pot={pot + seats.reduce((s, seat) => s + seat.currentBet, 0)}
                        pots={pots}
                        stakes={stakes}
                        tableSize={tableSize}
                        activeSeatIndex={activeSeatIndex}
                        onPressSeat={handlePressSeat}
                        onPressBoardSlot={handlePressBoardSlot}
                        showCards={showCards}
                        displayMode={displayMode}
                        bb={bb}
                    />
                </View>

                {/* Bottom Controls */}
                <View style={styles.bottomControls}>
                    {/* Compact Toolbar Row */}
                    <View style={styles.toolbar}>
                        {/* History button */}
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => setHistoryModalVisible(true)}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="list-outline" size={14} color="#9aa3a8" />
                            <Text style={styles.toolbarBtnText}>History</Text>
                        </TouchableOpacity>



                        {/* Notes button */}
                        <TouchableOpacity
                            style={styles.toolbarBtn}
                            onPress={() => setNotesModalVisible(true)}
                            activeOpacity={0.6}
                        >
                            <Ionicons name="document-text-outline" size={14} color="#9aa3a8" />
                            <Text style={styles.toolbarBtnText}>Notes</Text>
                        </TouchableOpacity>

                        {/* Show Cards toggle */}
                        <TouchableOpacity
                            style={[styles.toolbarBtn, showCards && styles.toolbarBtnActive]}
                            onPress={() => setShowCards(!showCards)}
                            activeOpacity={0.6}
                        >
                            <Ionicons name={showCards ? 'eye' : 'eye-off'} size={14} color={showCards ? COLORS.accent : '#9aa3a8'} />
                            <Text style={[styles.toolbarBtnText, showCards && styles.toolbarBtnTextActive]}>Show Cards</Text>
                        </TouchableOpacity>

                        {/* BB/$ toggle */}
                        <TouchableOpacity
                            style={[styles.toolbarBtn, displayMode === 'bb' && styles.toolbarBtnActive]}
                            onPress={() => setDisplayMode(prev => prev === 'money' ? 'bb' : 'money')}
                            activeOpacity={0.6}
                        >
                            <Text style={[styles.toolbarToggleLabel, displayMode === 'bb' && styles.toolbarBtnTextActive]}>
                                {displayMode === 'bb' ? 'BB' : '$'}
                            </Text>
                        </TouchableOpacity>

                        {/* Table Size Stepper (right side) */}
                        <View style={styles.stepperRow}>
                            <TouchableOpacity
                                style={[styles.stepperBtn, tableSize <= 3 && styles.stepperBtnDisabled]}
                                onPress={() => handleTableSizeChange(-1)}
                                disabled={tableSize <= 3}
                                activeOpacity={0.6}
                            >
                                <Text style={[styles.stepperBtnText, tableSize <= 3 && styles.stepperBtnTextDisabled]}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.stepperLabel}>{tableSize}max</Text>
                            <TouchableOpacity
                                style={[styles.stepperBtn, tableSize >= 9 && styles.stepperBtnDisabled]}
                                onPress={() => handleTableSizeChange(1)}
                                disabled={tableSize >= 9}
                                activeOpacity={0.6}
                            >
                                <Text style={[styles.stepperBtnText, tableSize >= 9 && styles.stepperBtnTextDisabled]}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Action Buttons — disabled when waiting for community cards or all players all-in */}
                    <ActionButtons
                        onAction={handleAction}
                        canCheck={!actionsDisabled && canCheck}
                        canCall={!actionsDisabled && canCall}
                        canBet={!actionsDisabled && canBet}
                        canRaise={!actionsDisabled && canRaise}
                        callAmount={callAmount}
                        disabled={actionsDisabled}
                    />

                    {/* Playback Controls */}
                    <PlaybackControls
                        onShare={handleShare}
                        onPlay={handlePlay}
                        onPrev={handlePrev}
                        onNext={handleNext}
                        isPlaying={isPlaying}
                        hasActions={actions.length > 0}
                    />
                </View>
            </View>

            {/* Seat Modal */}
            <SeatModal
                visible={seatModalVisible}
                position={modalPosition}
                stack={modalStack}
                isBoardMode={isBoardMode}
                usedCards={usedCards}
                communityCards={communityCards}
                currentBoardSlot={currentBoardSlot}
                onClose={handleSeatModalClose}
                onCardAssigned={handleCardAssigned}
                onBoardCardRemove={handleBoardCardRemove}
                onBoardSlotSelect={handleBoardSlotSelect}
                onHero={handleHero}
                showToast={showToast}
            />

            {/* Action History Modal */}
            <ActionHistoryModal
                visible={historyModalVisible}
                actions={actions}
                onClose={() => setHistoryModalVisible(false)}
            />

            {/* Notes Modal */}
            <NotesModal
                visible={notesModalVisible}
                notes={notes}
                onChangeNotes={setNotes}
                onClose={() => setNotesModalVisible(false)}
            />

            {/* Bet Sizing Modal */}
            <BetSizingModal
                visible={betSizingVisible}
                actionLabel={pendingBetAction === 'bet' ? 'Bet' : 'Raise'}
                minBet={facingBet > 0 ? facingBet * 2 : bb}
                maxBet={activeSeat ? activeSeat.stack + activeSeat.currentBet : 1000}
                bb={bb}
                pot={pot}
                onConfirm={handleBetConfirm}
                onCancel={handleBetCancel}
            />
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    newHandBtn: {
        position: 'absolute',
        top: 8,
        right: 12,
        zIndex: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    tableContainer: {
        flex: 1,
        paddingHorizontal: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },

    bottomControls: {
        // pinned at bottom, no flex growth
    },

    // Compact Toolbar
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    toolbarBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        paddingVertical: 5,
        paddingHorizontal: 7,
        borderRadius: 6,
        backgroundColor: 'rgba(255,255,255,0.04)',
        flexShrink: 1,
        minWidth: 0,
    },
    toolbarBtnActive: {
        backgroundColor: 'rgba(16,185,129,0.12)',
    },
    toolbarBtnText: {
        color: '#9aa3a8',
        fontSize: 11,
        flexShrink: 1,
    },
    toolbarBtnTextActive: {
        color: COLORS.accent,
    },
    toolbarToggleLabel: {
        color: '#9aa3a8',
        fontSize: 12,
        fontWeight: '800',
    },
    badge: {
        backgroundColor: COLORS.accent,
        borderRadius: 8,
        minWidth: 16,
        height: 16,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 4,
        marginLeft: 2,
    },
    badgeText: {
        color: '#000',
        fontSize: 9,
        fontWeight: '800',
    },

    // Stepper (inside toolbar, pushed right — fixed size, never shrinks)
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
        gap: 4,
        flexShrink: 0,
    },
    stepperBtn: {
        width: 26,
        height: 26,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16,185,129,0.08)',
    },
    stepperBtnDisabled: {
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: 'transparent',
    },
    stepperBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.accent,
        lineHeight: 18,
    },
    stepperBtnTextDisabled: {
        color: 'rgba(255,255,255,0.2)',
    },
    stepperLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#fff',
    },
});
