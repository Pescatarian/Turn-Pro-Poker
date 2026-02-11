import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { PokerTable, SeatData } from '../../components/replayer/PokerTable';
import { SeatModal } from '../../components/replayer/SeatModal';
import { ActionButtons, ActionType } from '../../components/replayer/ActionButtons';
import { ActionHistory, ActionRecord } from '../../components/replayer/ActionHistory';
import { PlaybackControls } from '../../components/replayer/PlaybackControls';
import { COLORS } from '../../constants/theme';

const POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'EP', 'MP', 'LJ', 'HJ', 'CO'];

function makeDefaultSeats(): SeatData[] {
    return POSITIONS.map((pos, i) => ({
        position: pos,
        stack: 1000,
        cards: [],
        isHero: false,
        isDealer: false,
        isFolded: false,
        isActive: true,
    }));
}

export default function HandHistoriesScreen() {
    // Seats state
    const [seats, setSeats] = useState<SeatData[]>(makeDefaultSeats());
    const [communityCards, setCommunityCards] = useState<string[]>(['', '', '', '', '']);
    const [pot, setPot] = useState(5);
    const [stakes, setStakes] = useState('$5/$10');

    // Seat Modal state
    const [seatModalVisible, setSeatModalVisible] = useState(false);
    const [selectedSeatIndex, setSelectedSeatIndex] = useState<number | null>(null);
    const [isBoardMode, setIsBoardMode] = useState(false);
    const [currentBoardSlot, setCurrentBoardSlot] = useState<number | null>(null);

    // Used cards tracking (card string -> owner label)
    const [usedCards, setUsedCards] = useState<Record<string, string>>({});

    // Tabs
    const [activeTab, setActiveTab] = useState<'history' | 'notes'>('history');
    const [showCards, setShowCards] = useState(false);

    // Action history
    const [actions, setActions] = useState<ActionRecord[]>([]);
    const [notes, setNotes] = useState('');

    // Active seat for actions
    const [activeSeatIndex, setActiveSeatIndex] = useState(0);

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

    const handleSitHere = useCallback(() => {
        if (selectedSeatIndex === null) return;
        setSeats(prev => prev.map((s, i) => ({
            ...s,
            isHero: i === selectedSeatIndex,
        })));
    }, [selectedSeatIndex]);

    const handleAction = useCallback((actionType: ActionType) => {
        const seat = seats[activeSeatIndex];
        const record: ActionRecord = {
            id: `${Date.now()}-${Math.random()}`,
            player: seat.position,
            action: actionType,
        };

        setActions(prev => [...prev, record]);

        // If fold, mark seat as folded
        if (actionType === 'fold') {
            setSeats(prev => {
                const next = [...prev];
                next[activeSeatIndex] = { ...next[activeSeatIndex], isFolded: true };
                return next;
            });
        }

        // Advance to next active (non-folded) seat
        let nextIndex = (activeSeatIndex + 1) % 9;
        let attempts = 0;
        while (seats[nextIndex].isFolded && attempts < 9) {
            nextIndex = (nextIndex + 1) % 9;
            attempts++;
        }
        setActiveSeatIndex(nextIndex);
    }, [activeSeatIndex, seats]);

    const handleShare = useCallback(() => {
        Alert.alert('Share', 'Hand sharing coming soon');
    }, []);

    const handlePlay = useCallback(() => {
        Alert.alert('Play', 'Replay animation coming soon');
    }, []);

    const handlePrev = useCallback(() => {
        if (actions.length === 0) return;
        // Remove last action
        const lastAction = actions[actions.length - 1];
        setActions(prev => prev.slice(0, -1));

        // Un-fold if it was a fold
        if (lastAction.action === 'fold') {
            const seatIdx = POSITIONS.indexOf(lastAction.player);
            if (seatIdx !== -1) {
                setSeats(prev => {
                    const next = [...prev];
                    next[seatIdx] = { ...next[seatIdx], isFolded: false };
                    return next;
                });
            }
        }
    }, [actions]);

    const handleNext = useCallback(() => {
        // Same as advancing seat
        let nextIndex = (activeSeatIndex + 1) % 9;
        let attempts = 0;
        while (seats[nextIndex].isFolded && attempts < 9) {
            nextIndex = (nextIndex + 1) % 9;
            attempts++;
        }
        setActiveSeatIndex(nextIndex);
    }, [activeSeatIndex, seats]);

    const modalPosition = isBoardMode
        ? 'Board'
        : selectedSeatIndex !== null
            ? seats[selectedSeatIndex].position
            : '--';

    const modalStack = selectedSeatIndex !== null ? seats[selectedSeatIndex].stack : 1000;

    return (
        <ScreenWrapper hideHeader>
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Poker Table */}
                <View style={styles.tableContainer}>
                    <PokerTable
                        seats={seats}
                        communityCards={communityCards}
                        pot={pot}
                        stakes={stakes}
                        onPressSeat={handlePressSeat}
                        onPressBoardSlot={handlePressBoardSlot}
                    />
                </View>

                {/* Tabs */}
                <View style={styles.tabs}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'history' && styles.tabActive]}
                        onPress={() => setActiveTab('history')}
                    >
                        <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>History</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
                        onPress={() => setActiveTab('notes')}
                    >
                        <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Notes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, styles.showCardsTab]}
                        onPress={() => setShowCards(!showCards)}
                    >
                        <Text style={styles.showCardsText}>🂠 {showCards ? 'Hide' : 'Show'} cards</Text>
                    </TouchableOpacity>
                </View>

                {/* Action History or Notes */}
                {activeTab === 'history' ? (
                    <ActionHistory actions={actions} />
                ) : (
                    <View style={styles.notesPanel}>
                        <TextInput
                            style={styles.notesInput}
                            placeholder="Add notes about this hand..."
                            placeholderTextColor="#666"
                            value={notes}
                            onChangeText={setNotes}
                            multiline
                        />
                    </View>
                )}

                {/* Action Buttons */}
                <ActionButtons onAction={handleAction} />

                {/* Playback Controls */}
                <PlaybackControls
                    onShare={handleShare}
                    onPlay={handlePlay}
                    onPrev={handlePrev}
                    onNext={handleNext}
                />

            </ScrollView>

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
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 12,
    },
    tableContainer: {
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Tabs
    tabs: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabActive: {
        borderBottomColor: COLORS.accent,
    },
    tabText: {
        color: COLORS.muted,
        fontSize: 14,
    },
    tabTextActive: {
        color: '#fff',
    },
    showCardsTab: {
        marginLeft: 'auto',
    },
    showCardsText: {
        color: COLORS.muted,
        fontSize: 13,
    },

    // Notes
    notesPanel: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    notesInput: {
        width: '100%',
        height: 80,
        backgroundColor: COLORS.bg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#fff',
        fontSize: 14,
        textAlignVertical: 'top',
    },
});
