import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export type ActionType = 'fold' | 'check' | 'call' | 'bet' | 'raise';

interface ActionButtonsProps {
    onAction: (action: ActionType) => void;
    /** Which actions should be shown/enabled */
    canCheck: boolean;
    canCall: boolean;
    canBet: boolean;
    canRaise: boolean;
    callAmount?: number;
    disabled?: boolean;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    onAction,
    canCheck,
    canCall,
    canBet,
    canRaise,
    callAmount,
    disabled,
}) => {
    return (
        <View style={styles.container}>
            {/* Fold — always visible but can be disabled */}
            <TouchableOpacity
                style={[styles.btn, { backgroundColor: disabled ? '#3a3a3a' : '#6c757d' }]}
                onPress={() => onAction('fold')}
                activeOpacity={0.7}
                disabled={disabled}
            >
                <Text style={[styles.label, { color: disabled ? '#666' : '#fff' }]}>Fold</Text>
            </TouchableOpacity>

            {/* Check or Call (mutually exclusive) */}
            {canCheck ? (
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#10b981' }]}
                    onPress={() => onAction('check')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.label, { color: '#fff' }]}>Check</Text>
                </TouchableOpacity>
            ) : canCall ? (
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#10b981' }]}
                    onPress={() => onAction('call')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.label, { color: '#fff' }]}>
                        Call{callAmount ? ` ${callAmount}` : ''}
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* Bet or Raise (mutually exclusive) */}
            {canBet ? (
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#f97316' }]}
                    onPress={() => onAction('bet')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.label, { color: '#fff' }]}>Bet</Text>
                </TouchableOpacity>
            ) : canRaise ? (
                <TouchableOpacity
                    style={[styles.btn, { backgroundColor: '#ef4444' }]}
                    onPress={() => onAction('raise')}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.label, { color: '#fff' }]}>Raise</Text>
                </TouchableOpacity>
            ) : null}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    btn: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    label: {
        fontWeight: '600',
        fontSize: 13,
    },
});
