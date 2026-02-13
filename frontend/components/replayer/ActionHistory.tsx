import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface ActionRecord {
    id: string;
    player: string;
    action: string;
    amount?: number;
}

interface ActionHistoryProps {
    actions: ActionRecord[];
}

const ACTION_STYLES: Record<string, { bg: string; color: string }> = {
    fold: { bg: 'rgba(108,117,125,0.3)', color: '#adb5bd' },
    check: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    call: { bg: 'rgba(16,185,129,0.2)', color: '#10b981' },
    bet: { bg: 'rgba(212,175,55,0.2)', color: '#10b981' },
    raise: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444' },
};

export const ActionHistory: React.FC<ActionHistoryProps> = ({ actions }) => {
    if (actions.length === 0) {
        return (
            <View style={styles.container}>
                <View style={styles.emptyPill}>
                    <Text style={styles.emptyText}>No actions yet</Text>
                </View>
            </View>
        );
    }

    return (
        <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.container}
        >
            {actions.map(a => {
                const s = ACTION_STYLES[a.action] || ACTION_STYLES.fold;
                const label = a.amount ? `${a.action} $${a.amount}` : a.action;
                return (
                    <View key={a.id} style={[styles.pill, { backgroundColor: s.bg }]}>
                        <Text style={styles.playerText}>{a.player}</Text>
                        <Text style={[styles.actionText, { color: s.color }]}>{label}</Text>
                    </View>
                );
            })}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    pill: {
        flexDirection: 'column',
        alignItems: 'center',
        minWidth: 70,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
    },
    actionText: {
        fontWeight: '600',
        fontSize: 12,
        textTransform: 'capitalize',
    },
    playerText: {
        color: '#9aa3a8',
        fontSize: 11,
        marginTop: 2,
    },
    emptyPill: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#9aa3a8',
        fontSize: 12,
    },
});
