import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Card } from './Card';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

const SUITS: { key: string; symbol: string; color: string }[] = [
    { key: 'h', symbol: '♥', color: '#ef4444' },
    { key: 's', symbol: '♠', color: '#1a1a2e' },
    { key: 'd', symbol: '♦', color: '#f97316' },
    { key: 'c', symbol: '♣', color: '#10b981' },
];

// Board mode: 2 rows of 7 (A-8, 7-2+?)
const BOARD_RANK_ROWS = [
    RANKS.slice(0, 7),             // A K Q J T 9 8
    [...RANKS.slice(7, 13), '?'],  // 7 6 5 4 3 2 ?
];

// Seat mode: 3 rows of 5-5-4 (original layout)
const SEAT_RANK_ROWS = [
    RANKS.slice(0, 5),   // A K Q J T
    RANKS.slice(5, 10),  // 9 8 7 6 5
    [...RANKS.slice(10, 13), '?'], // 4 3 2 ?
];

function parseCard(c: string): { rank: string; suit: 'h' | 'd' | 'c' | 's' } | null {
    if (!c || c.length < 2) return null;
    return { rank: c.slice(0, -1), suit: c.slice(-1) as any };
}

interface SeatModalProps {
    visible: boolean;
    position: string;
    stack: number;
    isBoardMode: boolean;
    usedCards: Record<string, string>;
    communityCards?: string[];      // current board cards
    currentBoardSlot?: number | null; // which slot is being filled
    onClose: (newStack?: number) => void;
    onCardAssigned: (card: string) => void;
    onBoardCardRemove?: (slotIndex: number) => void; // tap filled card to remove
    onBoardSlotSelect?: (slotIndex: number) => void; // tap empty slot to switch
    onHero: () => void;
    showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const SeatModal: React.FC<SeatModalProps> = ({
    visible,
    position,
    stack,
    isBoardMode,
    usedCards,
    communityCards = ['', '', '', '', ''],
    currentBoardSlot,
    onClose,
    onCardAssigned,
    onBoardCardRemove,
    onBoardSlotSelect,
    onHero,
    showToast,
}) => {
    const [selectedRank, setSelectedRank] = useState<string | null>(null);
    const [localStack, setLocalStack] = useState(String(stack));

    // Sync localStack when modal opens for a different player
    useEffect(() => {
        if (visible) {
            setLocalStack(String(stack));
            setSelectedRank(null);
        }
    }, [visible, stack]);

    const handleSelectRank = useCallback((rank: string) => {
        setSelectedRank(rank);
    }, []);

    const handleSelectSuit = useCallback((suit: string) => {
        if (!selectedRank) return;
        const card = selectedRank + suit;

        if (usedCards[card]) {
            setSelectedRank(null);
            return;
        }

        onCardAssigned(card);
        setSelectedRank(null);
    }, [selectedRank, usedCards, onCardAssigned]);

    const handleClose = useCallback(() => {
        const newStack = parseInt(localStack) || stack;
        onClose(isBoardMode ? undefined : newStack);
        setSelectedRank(null);
    }, [localStack, stack, isBoardMode, onClose]);

    const rankRows = isBoardMode ? BOARD_RANK_ROWS : SEAT_RANK_ROWS;

    // Render the rank/suit card picker (shared between both modes)
    const renderCardPicker = () => (
        <>
            {rankRows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.rankRow}>
                    {row.map(rank => {
                        const isUnknown = rank === '?';
                        const isSelected = selectedRank === rank;
                        return (
                            <TouchableOpacity
                                key={rank}
                                style={[
                                    styles.rankCard,
                                    isBoardMode && styles.rankCardBoard,
                                    isUnknown && { backgroundColor: '#555' },
                                    isSelected && styles.rankCardSelected,
                                ]}
                                onPress={() => {
                                    if (isUnknown) {
                                        onCardAssigned('??');
                                        setSelectedRank(null);
                                    } else {
                                        handleSelectRank(rank);
                                    }
                                }}
                            >
                                <Text style={[
                                    styles.rankText,
                                    isBoardMode && styles.rankTextBoard,
                                    isUnknown && { color: '#fff' },
                                    isSelected && styles.rankTextSelected,
                                ]}>
                                    {rank}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            ))}

            {/* Suit Row */}
            <View style={styles.suitsRow}>
                {SUITS.map(s => (
                    <TouchableOpacity
                        key={s.key}
                        style={[styles.suitBtn, isBoardMode && styles.suitBtnBoard]}
                        onPress={() => handleSelectSuit(s.key)}
                    >
                        <Text style={[styles.suitText, { color: s.color }]}>{s.symbol}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity activeOpacity={1} style={[styles.modal, isBoardMode && styles.modalBoard]}>
                    {isBoardMode ? (
                        /* === BOARD MODE — vertical compact layout === */
                        <View style={styles.boardContainer}>
                            {/* Community Cards Header */}
                            <View style={styles.boardHeader}>
                                {[0, 1, 2, 3, 4].map(i => {
                                    const parsed = parseCard(communityCards[i]);
                                    const hasFill = !!communityCards[i];
                                    const isActive = i === currentBoardSlot;
                                    return (
                                        <TouchableOpacity
                                            key={`board-${i}`}
                                            activeOpacity={0.6}
                                            onPress={() => {
                                                if (hasFill) {
                                                    // Tap filled card → remove it
                                                    onBoardCardRemove?.(i);
                                                } else {
                                                    // Tap empty slot → switch active slot
                                                    onBoardSlotSelect?.(i);
                                                }
                                            }}
                                            style={[
                                                styles.boardSlot,
                                                isActive && styles.boardSlotActive,
                                            ]}
                                        >
                                            <Card
                                                rank={parsed?.rank}
                                                suit={parsed?.suit}
                                                size="small"
                                                revealed={!!parsed}
                                            />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            {/* Card Picker */}
                            <View style={styles.boardPicker}>
                                {renderCardPicker()}
                            </View>

                            {/* Done */}
                            <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                                <Text style={styles.doneBtnText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        /* === SEAT MODE — original left-right split === */
                        <>
                            <View style={styles.splitContainer}>
                                {/* LEFT — Seat Info */}
                                <View style={styles.leftPanel}>
                                    <Text style={styles.seatLabel}>
                                        Seat <Text style={styles.seatPos}>{position}</Text>
                                    </Text>

                                    <TouchableOpacity style={styles.actionBtn} onPress={onHero}>
                                        <Text style={styles.actionBtnText}>Hero</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionBtn} onPress={() => showToast?.('Coming soon', 'info')}>
                                        <Text style={styles.actionBtnText}>Link Player</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionBtn} onPress={() => showToast?.('Coming soon', 'info')}>
                                        <Text style={styles.actionBtnText}>Tag</Text>
                                    </TouchableOpacity>

                                    <View style={styles.stackRow}>
                                        <Text style={styles.stackLabel}>Stack</Text>
                                        <TextInput
                                            style={styles.stackInput}
                                            value={localStack}
                                            onChangeText={setLocalStack}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                </View>

                                {/* RIGHT — Card Picker */}
                                <View style={styles.rightPanel}>
                                    {renderCardPicker()}
                                </View>
                            </View>

                            {/* Done Button */}
                            <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                                <Text style={styles.doneBtnText}>Done</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'flex-end', // push modal to bottom so board stays visible
        alignItems: 'center',
        padding: 16,
        paddingBottom: 40,
    },
    modal: {
        backgroundColor: '#1e1e1e',
        width: '100%',
        maxWidth: 420,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        paddingHorizontal: 14,
        paddingVertical: 14,
    },
    modalBoard: {
        // Board mode: slightly more compact
        paddingVertical: 10,
        paddingHorizontal: 10,
    },

    /* === BOARD MODE === */
    boardContainer: {
        alignItems: 'center',
        gap: 8,
    },
    boardHeader: {
        flexDirection: 'row',
        gap: 4,
        justifyContent: 'center',
        marginBottom: 4,
    },
    boardSlot: {
        borderRadius: 4,
        borderWidth: 2,
        borderColor: 'transparent',
        padding: 1,
    },
    boardSlotActive: {
        borderColor: '#10b981',
    },
    boardPicker: {
        alignItems: 'center',
        gap: 4,
    },

    /* === SEAT MODE (left-right split) === */
    splitContainer: {
        flexDirection: 'row',
        gap: 14,
    },
    leftPanel: {
        flex: 1,
        justifyContent: 'center',
        gap: 8,
    },
    seatLabel: {
        color: '#9aa3a8',
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    seatPos: {
        color: '#fff',
        fontWeight: '700',
    },
    actionBtn: {
        height: 36,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
    stackRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    stackLabel: {
        color: '#9aa3a8',
        fontSize: 14,
        fontWeight: '600',
    },
    stackInput: {
        flex: 1,
        height: 36,
        padding: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        color: '#fff',
        fontSize: 14,
    },
    rightPanel: {
        flex: 1,
        gap: 5,
        alignItems: 'center',
        paddingTop: 28,
    },

    /* === SHARED — Card Picker === */
    rankRow: {
        flexDirection: 'row',
        gap: 4,
    },
    rankCard: {
        width: 32,
        height: 38,
        backgroundColor: '#fff',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    rankCardBoard: {
        width: 38,
        height: 40,
    },
    rankCardSelected: {
        borderColor: '#10b981',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
    },
    rankTextBoard: {
        fontSize: 16,
    },
    rankTextSelected: {
        color: '#10b981',
    },
    suitsRow: {
        flexDirection: 'row',
        gap: 5,
        marginTop: 4,
    },
    suitBtn: {
        width: 36,
        height: 38,
        backgroundColor: '#fff',
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suitBtnBoard: {
        width: 42,
        height: 42,
    },
    suitText: {
        fontSize: 22,
    },

    /* === DONE === */
    doneBtn: {
        width: '100%',
        paddingVertical: 10,
        backgroundColor: '#10b981',
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 8,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
