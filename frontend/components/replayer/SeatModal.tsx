import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Dimensions } from 'react-native';

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
const SUITS: { key: string; symbol: string; color: string }[] = [
    { key: 'h', symbol: '♥', color: '#ef4444' },
    { key: 's', symbol: '♠', color: '#fff' },
    { key: 'd', symbol: '♦', color: '#f97316' },
    { key: 'c', symbol: '♣', color: '#22c55e' },
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
            // Card already used — ignore silently or could show toast
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
            animationType="slide"
            onRequestClose={handleClose}
        >
            <TouchableOpacity
                style={styles.backdrop}
                activeOpacity={1}
                onPress={handleClose}
            >
                <TouchableOpacity activeOpacity={1} style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerLabel}>
                            Seat <Text style={styles.headerPos}>{position}</Text>
                        </Text>
                        {!isBoardMode && (
                            <View style={styles.actions}>
                                <TouchableOpacity style={styles.actionBtn} onPress={onSitHere}>
                                    <Text style={styles.actionBtnText}>Sit Here</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Text style={styles.actionBtnText}>Link Player</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.actionBtn}>
                                    <Text style={styles.actionBtnText}>Tag</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* Stack Input */}
                    {!isBoardMode && (
                        <View style={styles.row}>
                            <Text style={styles.rowLabel}>Stack</Text>
                            <TextInput
                                style={styles.stackInput}
                                value={localStack}
                                onChangeText={setLocalStack}
                                keyboardType="numeric"
                            />
                        </View>
                    )}

                    {/* Card Ranks */}
                    <View style={styles.cardsGrid}>
                        {RANKS.map(rank => {
                            const isSelected = selectedRank === rank;
                            return (
                                <TouchableOpacity
                                    key={rank}
                                    style={[styles.rankCard, isSelected && styles.rankCardSelected]}
                                    onPress={() => handleSelectRank(rank)}
                                >
                                    <Text style={[styles.rankText, isSelected && styles.rankTextSelected]}>{rank}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Suits */}
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
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    modal: {
        backgroundColor: '#2a2a2a',
        width: '100%',
        maxWidth: 500,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        paddingHorizontal: 14,
        paddingTop: 10,
        paddingBottom: 14,
        maxHeight: '45%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    headerLabel: {
        color: '#9aa3a8',
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    headerPos: {
        color: '#fff',
    },
    actions: {
        flexDirection: 'row',
        gap: 10,
        flex: 3,
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        height: 38,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    row: {
        flexDirection: 'row',
        gap: 6,
        alignItems: 'center',
        marginBottom: 10,
    },
    rowLabel: {
        color: '#9aa3a8',
        fontSize: 18,
        fontWeight: '600',
        minWidth: 50,
    },
    stackInput: {
        width: 80,
        height: 38,
        padding: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        color: '#fff',
        fontSize: 16,
    },
    cardsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        justifyContent: 'center',
        marginBottom: 10,
    },
    rankCard: {
        width: 36,
        height: 44,
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
        fontSize: 16,
        fontWeight: '700',
        color: '#000',
    },
    rankTextSelected: {
        color: '#10b981',
    },
    suitsRow: {
        flexDirection: 'row',
        gap: 6,
        justifyContent: 'center',
        marginBottom: 0,
    },
    suitBtn: {
        width: 44,
        height: 44,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    suitText: {
        fontSize: 24,
    },
    doneBtn: {
        width: '100%',
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 6,
        alignItems: 'center',
        marginTop: 8,
    },
    doneBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
});
