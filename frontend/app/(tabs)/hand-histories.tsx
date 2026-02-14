import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AppState, AppStateStatus } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { PokerTable, SeatData } from '../../components/replayer/PokerTable';
import { SeatModal } from '../../components/replayer/SeatModal';
import { ActionButtons, ActionType } from '../../components/replayer/ActionButtons';
import { ActionRecord } from '../../components/replayer/ActionHistory';
import { ActionHistoryModal } from '../../components/replayer/ActionHistoryModal';
import { NotesModal } from '../../components/replayer/NotesModal';
import { PlaybackControls } from '../../components/replayer/PlaybackControls';
import { BetSizingModal } from '../../components/replayer/BetSizingModal';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../components/ui/ToastProvider';

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
    // BB is always at index 2, so first-to-act preflop = index 3
    // For 3-max: (3) % 3 = 0 (BTN), which is correct
    return 3 % tableSize;
}

export default function HandHistoriesScreen() {
    // Table size
    const [tableSize, setTableSize] = useState(9);

    const [stakes, setStakes] = useState('$5/$10');
    const { sb, bb } = parseStakes(stakes);

    // Seats state
    const [seats, setSeats] = useState<SeatData[]>(makeDefaultSeats(9, 5, 10));
    const [communityCards, setCommunityCards] = useState<string[]>(['', '', '', '', '']);
    const [pot, setPot] = useState(5 + 10); // SB + BB

    // Seat Modal state
    const [seatModalVisible, setSeatModalVisible] = useState(false);
    const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
    const [isBoardMode, setIsBoardMode] = useState(false);
    const [currentBoardSlot, setCurrentBoardSlot] = useState<number | null>(null);

    // Used cards tracking (card string -> owner label)
    const [usedCards, setUsedCards] = useState<Record<string, string>>({});

    // Action history & notes
    const [actions, setActions] = useState<ActionRecord[]>([]);
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

    // --- Table Size Stepper ---

    const handleTableSizeChange = useCallback((delta: number) => {
        setTableSize(prev => {
            const next = Math.max(3, Math.min(9, prev + delta));
            if (next !== prev) {
                // Reset seats, actions, etc. when table size changes
                const { sb: newSb, bb: newBb } = parseStakes(stakes);
                setSeats(makeDefaultSeats(next, newSb, newBb));
                setActions([]);
                setActiveSeatIndex(getInitialActiveIndex(next));
                setUsedCards({});
                setCommunityCards(['', '', '', '', '']);
                setPot(newSb + newBb);
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

            // Auto-advance to next empty slot
            const nextEmpty = communityCards.findIndex((c, i) => i > currentBoardSlot && !c);
            if (nextEmpty !== -1) {
                setCurrentBoardSlot(nextEmpty);
            } else {
                // All slots filled — close modal
                setSeatModalVisible(false);
                setCurrentBoardSlot(null);
                setIsBoardMode(false);
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
    const handleSitHere = useCallback(() => {
        if (selectedSeatIndex === null) return;

        const positions = POSITION_MAP[tableSize] || POSITION_MAP[9];
        const clickedLabel = seats[selectedSeatIndex].position;
        const clickedLabelIndex = positions.indexOf(clickedLabel);

        setSeats(prev => {
            return prev.map((seat, seatIndex) => {
                // Rotate labels so the clicked label lands on seat index 0 (6 o'clock)
                const labelIndex = ((clickedLabelIndex + seatIndex) % tableSize + tableSize) % tableSize;
                const newPosition = positions[labelIndex];
                const newBet = newPosition === 'SB' ? sb : newPosition === 'BB' ? bb : 0;
                return {
                    ...seat,
                    position: newPosition,
                    isHero: seatIndex === 0,            // seat 0 = hero (6 o'clock)
                    isDealer: newPosition === 'BTN',    // dealer chip follows BTN label
                    currentBet: newBet,
                    stack: seat.cards.length > 0 ? seat.stack : 1000 - newBet, // only reset stack if no cards assigned yet
                };
            });
        });

        // Reset active seat to UTG in the rotated layout
        // UTG label is at POSITION_MAP index 3; find which seat index it lands on
        const utgLabelIndex = 3; // UTG is always the 4th position in POSITION_MAP
        // After rotation, seat with label at positions[utgLabelIndex] lands on seat index:
        const utgSeatIndex = ((utgLabelIndex - clickedLabelIndex) % tableSize + tableSize) % tableSize;
        setActiveSeatIndex(utgSeatIndex);


    }, [selectedSeatIndex, seats, tableSize, showToast, sb, bb]);

    // Helper: advance to next non-folded seat
    const advanceSeat = useCallback(() => {
        let nextIndex = (activeSeatIndex + 1) % tableSize;
        let attempts = 0;
        while (seats[nextIndex].isFolded && attempts < tableSize) {
            nextIndex = (nextIndex + 1) % tableSize;
            attempts++;
        }
        setActiveSeatIndex(nextIndex);
    }, [activeSeatIndex, seats, tableSize]);

    const handleAction = useCallback((actionType: ActionType) => {
        const seat = seats[activeSeatIndex];

        if (actionType === 'bet' || actionType === 'raise') {
            // Open bet sizing modal instead of recording immediately
            setPendingBetAction(actionType === 'bet' ? 'bet' : 'raise');
            setBetSizingVisible(true);
            return;
        }

        if (actionType === 'fold') {
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: 'fold',
            };
            setActions(prev => [...prev, record]);
            setSeats(prev => {
                const next = [...prev];
                next[activeSeatIndex] = { ...next[activeSeatIndex], isFolded: true };
                return next;
            });
            advanceSeat();
            return;
        }

        if (actionType === 'call') {
            const toCall = facingBet - seat.currentBet;
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: 'call',
                amount: toCall,
            };
            setActions(prev => [...prev, record]);
            setSeats(prev => {
                const next = [...prev];
                next[activeSeatIndex] = {
                    ...next[activeSeatIndex],
                    currentBet: facingBet,
                    stack: next[activeSeatIndex].stack - toCall,
                };
                return next;
            });
            setPot(prev => prev + toCall);
            advanceSeat();
            return;
        }

        if (actionType === 'check') {
            const record: ActionRecord = {
                id: `${Date.now()}-${Math.random()}`,
                player: seat.position,
                action: 'check',
            };
            setActions(prev => [...prev, record]);
            advanceSeat();
            return;
        }
    }, [activeSeatIndex, seats, tableSize, facingBet, advanceSeat]);

    // Bet/Raise confirmed from modal
    const handleBetConfirm = useCallback((amount: number) => {
        setBetSizingVisible(false);
        const seat = seats[activeSeatIndex];
        const additionalCost = amount - seat.currentBet; // how much more from stack

        const record: ActionRecord = {
            id: `${Date.now()}-${Math.random()}`,
            player: seat.position,
            action: pendingBetAction,
            amount: amount,
        };
        setActions(prev => [...prev, record]);
        setSeats(prev => {
            const next = [...prev];
            next[activeSeatIndex] = {
                ...next[activeSeatIndex],
                currentBet: amount,
                stack: next[activeSeatIndex].stack - additionalCost,
            };
            return next;
        });
        setPot(prev => prev + additionalCost);
        advanceSeat();
    }, [activeSeatIndex, seats, pendingBetAction, advanceSeat]);

    const handleBetCancel = useCallback(() => {
        setBetSizingVisible(false);
    }, []);

    const handleShare = useCallback(() => {
        showToast('Hand sharing coming soon', 'info');
    }, []);

    const handlePlay = useCallback(() => {
        showToast('Replay animation coming soon', 'info');
    }, []);

    const handlePrev = useCallback(() => {
        if (actions.length === 0) return;
        // Remove last action
        const lastAction = actions[actions.length - 1];
        setActions(prev => prev.slice(0, -1));

        const seatIdx = seats.findIndex(s => s.position === lastAction.player);
        if (seatIdx === -1) return;

        // Un-fold if it was a fold
        if (lastAction.action === 'fold') {
            setSeats(prev => {
                const next = [...prev];
                next[seatIdx] = { ...next[seatIdx], isFolded: false };
                return next;
            });
            setActiveSeatIndex(seatIdx);
        }

        // Undo call: reverse the amount
        if (lastAction.action === 'call' && lastAction.amount) {
            setSeats(prev => {
                const next = [...prev];
                next[seatIdx] = {
                    ...next[seatIdx],
                    currentBet: next[seatIdx].currentBet - lastAction.amount!,
                    stack: next[seatIdx].stack + lastAction.amount!,
                };
                return next;
            });
            setPot(prev => prev - lastAction.amount!);
            setActiveSeatIndex(seatIdx);
        }

        // Undo bet/raise: reverse the amount
        if ((lastAction.action === 'bet' || lastAction.action === 'raise') && lastAction.amount) {
            const prevBet = seats[seatIdx].currentBet; // currently the bet amount
            // We need to figure out how much was added. The record.amount is the total bet.
            // The additional cost was (record.amount - previous currentBet before the bet).
            // Since we don't store previous currentBet, we'll use the difference
            // Actually: currentBet is now lastAction.amount, stack was reduced by (amount - prevCurrentBet)
            // We can approximate: just set currentBet to 0 if it was a bet, or to the previous facing bet for raise
            // Simplest: record amount in the action, then reverse
            setSeats(prev => {
                const next = [...prev];
                // Restore: we added (lastAction.amount - previousCurrentBet) to the pot.
                // previousCurrentBet can be calculated from: stack_now + additionalCost = stack_before
                // For simplicity, reset currentBet based on position (SB/BB get their blind back)
                const pos = next[seatIdx].position;
                const originalBet = pos === 'SB' ? sb : pos === 'BB' ? bb : 0;
                const additionalCost = lastAction.amount! - originalBet;
                next[seatIdx] = {
                    ...next[seatIdx],
                    currentBet: originalBet,
                    stack: next[seatIdx].stack + additionalCost,
                };
                return next;
            });
            // Reverse pot
            const pos = seats[seatIdx].position;
            const originalBet = pos === 'SB' ? sb : pos === 'BB' ? bb : 0;
            const additionalCost = lastAction.amount! - originalBet;
            setPot(prev => prev - additionalCost);
            setActiveSeatIndex(seatIdx);
        }

        // Undo check: just move active seat back
        if (lastAction.action === 'check') {
            setActiveSeatIndex(seatIdx);
        }
    }, [actions, tableSize, seats, sb, bb]);

    const handleNext = useCallback(() => {
        // Same as advancing seat
        let nextIndex = (activeSeatIndex + 1) % tableSize;
        let attempts = 0;
        while (seats[nextIndex].isFolded && attempts < tableSize) {
            nextIndex = (nextIndex + 1) % tableSize;
            attempts++;
        }
        setActiveSeatIndex(nextIndex);
    }, [activeSeatIndex, seats, tableSize]);

    const modalPosition = isBoardMode
        ? 'Board'
        : selectedSeatIndex !== null
            ? seats[selectedSeatIndex].position
            : '--';

    const modalStack = selectedSeatIndex !== null ? seats[selectedSeatIndex].stack : 1000;

    return (
        <ScreenWrapper hideHeader>
            <View style={styles.container}>

                {/* Poker Table — fills available space */}
                <View style={styles.tableContainer}>
                    <PokerTable
                        seats={seats}
                        communityCards={communityCards}
                        pot={pot}
                        stakes={stakes}
                        tableSize={tableSize}
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

                    {/* Action Buttons */}
                    <ActionButtons
                        onAction={handleAction}
                        canCheck={canCheck}
                        canCall={canCall}
                        canBet={canBet}
                        canRaise={canRaise}
                        callAmount={callAmount}
                    />

                    {/* Playback Controls */}
                    <PlaybackControls
                        onShare={handleShare}
                        onPlay={handlePlay}
                        onPrev={handlePrev}
                        onNext={handleNext}
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
                onClose={handleSeatModalClose}
                onCardAssigned={handleCardAssigned}
                onSitHere={handleSitHere}
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
