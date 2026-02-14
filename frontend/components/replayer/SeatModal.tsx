import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal } from 'react-native';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];

// Use variation selector VS15 (\uFE0E) to force text rendering on Android
// so the color style is respected instead of emoji default colors
const SUITS: { key: string; symbol: string; color: string }[] = [
    { key: 'h', symbol: '♥', color: '#ef4444' },
    { key: 's', symbol: '♠', color: '#1a1a2e' },
    { key: 'd', symbol: '♦', color: '#f97316' },
    { key: 'c', symbol: '♣', color: '#22c55e' },
];

// Split ranks into rows of 5-5-3
const RANK_ROWS = [
    RANKS.slice(0, 5),   // A K Q J T
    RANKS.slice(5, 10),  // 9 8 7 6 5
    RANKS.slice(10, 13), // 4 3 2
];

interface SeatModalProps {
    visible: boolean;
    position: string;
    stack: number;
    isBoardMode: boolean;
    usedCards: Record<string, string>;
    onClose: (newStack?: number) => void;
    onCardAssigned: (card: string) => void;
    onSitHere: () => void;
}

export const SeatModal: React.FC<SeatModalProps> = ({
    visible,
    position,
    stack,
    isBoardMode,
    usedCards,
    onClose,
    onCardAssigned,
    onSitHere,
}) => {
    const [selectedRank, setSelectedRank] = useState<string | null>(null);
    const [localStack, setLocalStack] = useState(String(stack));

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
                <TouchableOpacity activeOpacity={1} style={styles.modal}>
                    <View style={styles.splitContainer}>
                        {/* LEFT — Seat Info or Title */}
                        <View style={styles.leftPanel}>
                            <Text style={styles.seatLabel}>
                                {isBoardMode ? 'Community Cards' : (
                                    <>Seat <Text style={styles.seatPos}>{position}</Text></>
                                )}
                            </Text>

                            {!isBoardMode && (
                                <>
                                    <TouchableOpacity style={styles.actionBtn} onPress={onSitHere}>
                                        <Text style={styles.actionBtnText}>Sit Here</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionBtn}>
                                        <Text style={styles.actionBtnText}>Link Player</Text>
                                    </TouchableOpacity>

                                    <TouchableOpacity style={styles.actionBtn}>
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
                                </>
                            )}
                        </View>

                        {/* RIGHT — Card Picker */}
                        <View style={styles.rightPanel}>
                            {RANK_ROWS.map((row, rowIdx) => (
                                <View key={rowIdx} style={styles.rankRow}>
                                    {row.map(rank => {
                                        const isSelected = selectedRank === rank;
                                        return (
                                            <TouchableOpacity
                                                key={rank}
                                                style={[styles.rankCard, isSelected && styles.rankCardSelected]}
                                                onPress={() => handleSelectRank(rank)}
                                            >
                                                <Text style={[styles.rankText, isSelected && styles.rankTextSelected]}>
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
                                        style={styles.suitBtn}
                                        onPress={() => handleSelectSuit(s.key)}
                                    >
                                        <Text style={[styles.suitText, { color: s.color }]}>{s.symbol}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* Done Button */}
                    <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                        <Text style={styles.doneBtnText}>Done</Text>
                    </TouchableOpacity>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
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
    splitContainer: {
        flexDirection: 'row',
        gap: 14,
    },
    /* ---- LEFT PANEL ---- */
    leftPanel: {
        flex: 1,
        gap: 8,
    },
    seatLabel: {
        color: '#9aa3a8',
        fontSize: 16,
        fontWeight: '600',
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
    /* ---- RIGHT PANEL ---- */
    rightPanel: {
        flex: 1,
        gap: 5,
        alignItems: 'center',
    },
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
    rankCardSelected: {
        borderColor: '#10b981',
    },
    rankText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#000',
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
    suitText: {
        fontSize: 22,
    },
    /* ---- DONE ---- */
    doneBtn: {
        width: '100%',
        paddingVertical: 10,
        backgroundColor: '#10b981',
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 12,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
