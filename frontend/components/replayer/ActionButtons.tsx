import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise';

interface ActionButtonsProps {
    onAction: (action: ActionType) => void;
}

const ACTIONS: { type: ActionType; label: string; bg: string; color: string }[] = [
    { type: 'fold', label: 'Fold', bg: '#6c757d', color: '#fff' },
    { type: 'check', label: 'Check', bg: '#10b981', color: '#fff' },
    { type: 'call', label: 'Call', bg: '#10b981', color: '#fff' },
    { type: 'bet', label: 'Bet', bg: '#10b981', color: '#000' },
    { type: 'raise', label: 'Raise', bg: '#ef4444', color: '#fff' },
];

export const ActionButtons: React.FC<ActionButtonsProps> = ({ onAction }) => {
    return (
        <View style={styles.container}>
            {ACTIONS.map(a => (
                <TouchableOpacity
                    key={a.type}
                    style={[styles.btn, { backgroundColor: a.bg }]}
                    onPress={() => onAction(a.type)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.label, { color: a.color }]}>{a.label}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexWrap: 'wrap',
    },
    btn: {
        flex: 1,
        minWidth: 60,
        paddingVertical: 10,
        paddingHorizontal: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '600',
        fontSize: 13,
    },
});
