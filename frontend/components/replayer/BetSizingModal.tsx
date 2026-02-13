import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';

interface BetSizingModalProps {
    visible: boolean;
    actionLabel: 'Bet' | 'Raise';
    minBet: number;
    maxBet: number; // player's effective stack
    bb: number;     // big blind for increment step
    pot: number;
    onConfirm: (amount: number) => void;
    onCancel: () => void;
}

export const BetSizingModal: React.FC<BetSizingModalProps> = ({
    visible,
    actionLabel,
    minBet,
    maxBet,
    bb,
    pot,
    onConfirm,
    onCancel,
}) => {
    const [amount, setAmount] = useState(minBet);

    useEffect(() => {
        if (visible) setAmount(minBet);
    }, [visible, minBet]);

    const clamp = (v: number) => Math.max(minBet, Math.min(maxBet, Math.round(v)));
    const step = bb || 10;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.modal}>
                    {/* Header */}
                    <Text style={styles.title}>{actionLabel} Amount</Text>

                    {/* Amount Display with ± */}
                    <View style={styles.amountRow}>
                        <TouchableOpacity
                            style={styles.adjustBtn}
                            onPress={() => setAmount(prev => clamp(prev - step))}
                        >
                            <Text style={styles.adjustBtnText}>−</Text>
                        </TouchableOpacity>
                        <TextInput
                            style={styles.amountInput}
                            keyboardType="numeric"
                            value={String(amount)}
                            onChangeText={(t) => {
                                const n = parseInt(t) || 0;
                                setAmount(n);
                            }}
                            onBlur={() => setAmount(clamp(amount))}
                            selectTextOnFocus
                        />
                        <TouchableOpacity
                            style={styles.adjustBtn}
                            onPress={() => setAmount(prev => clamp(prev + step))}
                        >
                            <Text style={styles.adjustBtnText}>+</Text>
                        </TouchableOpacity>
                    </View>

                    {/* 3-Button Row: Cancel | Raise/Bet {amount} | All-In */}
                    <View style={styles.actions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[
                                styles.confirmBtn,
                                actionLabel === 'Raise' && styles.confirmBtnRaise,
                            ]}
                            onPress={() => onConfirm(clamp(amount))}
                        >
                            <Text style={styles.confirmText}>
                                {actionLabel} {clamp(amount)}
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.allInBtn}
                            onPress={() => onConfirm(maxBet)}
                        >
                            <Text style={styles.allInText}>All-In</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    modal: {
        width: '100%',
        maxWidth: 320,
        backgroundColor: '#111214',
        borderRadius: 14,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    title: {
        color: '#e6eef1',
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 14,
    },
    amountRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
    },
    adjustBtn: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    adjustBtnText: {
        color: '#10b981',
        fontSize: 22,
        fontWeight: '700',
    },
    amountInput: {
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 14,
        color: '#10b981',
        fontSize: 24,
        fontWeight: '800',
        textAlign: 'center',
        minWidth: 110,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    cancelBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelText: {
        color: '#9aa3a8',
        fontSize: 13,
        fontWeight: '600',
    },
    confirmBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: '#f97316',
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnRaise: {
        backgroundColor: '#ef4444',
    },
    confirmText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    allInBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        backgroundColor: 'rgba(239,68,68,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239,68,68,0.3)',
    },
    allInText: {
        color: '#ef4444',
        fontSize: 13,
        fontWeight: '700',
    },
});
