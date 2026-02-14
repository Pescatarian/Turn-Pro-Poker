import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

export interface ActionRecord {
    id: string;
    player: string;
    action: string;
    amount?: number;
}

interface ActionHistoryModalProps {
    visible: boolean;
    actions: ActionRecord[];
    onClose: () => void;
}

const ACTION_STYLES: Record<string, { bg: string; color: string }> = {
    fold: { bg: 'rgba(108,117,125,0.3)', color: '#adb5bd' },
    check: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    call: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    bet: { bg: 'rgba(212,175,55,0.2)', color: '#d4af37' },
    raise: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
};

export const ActionHistoryModal: React.FC<ActionHistoryModalProps> = ({ visible, actions, onClose }) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <Ionicons name="list-outline" size={18} color={COLORS.accent} />
                            <Text style={styles.title}>Action History</Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            style={styles.closeBtn}
                        >
                            <Ionicons name="close" size={20} color="#999" />
                        </TouchableOpacity>
                    </View>

                    {/* Actions List */}
                    <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                        {actions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="time-outline" size={32} color="#444" />
                                <Text style={styles.emptyText}>No actions recorded yet</Text>
                            </View>
                        ) : (
                            actions.map((a, index) => {
                                const s = ACTION_STYLES[a.action] || ACTION_STYLES.fold;
                                const label = a.amount ? `${a.action} $${a.amount}` : a.action;
                                return (
                                    <View key={a.id} style={styles.actionRow}>
                                        <Text style={styles.actionIndex}>{index + 1}</Text>
                                        <View style={[styles.actionPill, { backgroundColor: s.bg }]}>
                                            <Text style={styles.playerText}>{a.player}</Text>
                                            <Text style={[styles.actionLabel, { color: s.color }]}>{label}</Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    container: {
        width: '100%',
        maxHeight: '70%',
        backgroundColor: '#1e1e1e',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    closeBtn: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        flex: 1,
    },
    listContent: {
        padding: 14,
        gap: 6,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    actionIndex: {
        color: '#555',
        fontSize: 12,
        fontWeight: '600',
        width: 20,
        textAlign: 'center',
    },
    actionPill: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 8,
    },
    playerText: {
        color: '#9aa3a8',
        fontSize: 13,
        fontWeight: '600',
    },
    actionLabel: {
        fontSize: 13,
        fontWeight: '700',
        textTransform: 'capitalize',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
        gap: 10,
    },
    emptyText: {
        color: '#666',
        fontSize: 14,
    },
});
