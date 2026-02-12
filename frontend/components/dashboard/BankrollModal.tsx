import React, { useState, useEffect, useCallback } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    AppState,
    AppStateStatus,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../model';
import { Q } from '@nozbe/watermelondb';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useToast } from '../ui/ToastProvider';

type ModalView = 'menu' | 'form';

interface BankrollModalProps {
    visible: boolean;
    onClose: () => void;
    currentBankroll: number;
    onTransactionSaved: () => void;
}

export function BankrollModal({ visible, onClose, currentBankroll, onTransactionSaved }: BankrollModalProps) {
    const { privacyMode } = usePrivacy();
    const router = useRouter();
    const { showToast } = useToast();
    const [view, setView] = useState<ModalView>('menu');
    const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    // Fix #4: Close modal when app goes to background (passcode activates)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'background' || nextState === 'inactive') {
                if (visible) onClose();
            }
        });
        return () => subscription.remove();
    }, [visible, onClose]);

    useEffect(() => {
        if (visible) {
            setView('menu');
        }
    }, [visible]);

    const resetForm = () => {
        setAmount('');
        setNote('');
    };

    const handleOpenForm = (type: 'deposit' | 'withdrawal') => {
        setTransactionType(type);
        resetForm();
        setView('form');
    };

    const handleSave = async () => {
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            showToast('Please enter a valid positive amount.', 'error');
            return;
        }

        await database.write(async () => {
            await database.collections.get('transactions').create((txn: any) => {
                txn._setRaw('amount', num);
                txn._setRaw('type', transactionType);
                txn._setRaw('notes', note.trim() || (transactionType === 'deposit' ? 'Deposit' : 'Withdrawal'));
                txn._setRaw('created_at', Date.now());
                txn._setRaw('updated_at', Date.now());
            });
        });

        onTransactionSaved();
        resetForm();
        setView('menu');
    };

    const formatCurrency = (n: number) => {
        if (privacyMode) return '••••';
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // Fix #3: Navigate to full transactions page
    const handleViewTransactions = () => {
        onClose();
        router.push('/(tabs)/more/transactions' as any);
    };

    /* ─── Menu View ─── */
    const renderMenu = () => (
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Manage Bankroll</Text>
            <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Current Balance: </Text>
                <Text style={styles.balanceValue}>{formatCurrency(currentBankroll)}</Text>
            </View>
            <View style={styles.buttonGrid}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity style={styles.depositBtn} onPress={() => handleOpenForm('deposit')}>
                        <LinearGradient colors={GRADIENTS.button} style={styles.depositGradient}>
                            <Ionicons name="add-circle-outline" size={14} color="#052018" />
                            <Text style={styles.depositText}>Deposit</Text>
                        </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.withdrawBtn} onPress={() => handleOpenForm('withdrawal')}>
                        <Ionicons name="remove-circle-outline" size={14} color={COLORS.danger} />
                        <Text style={styles.withdrawText}>Withdraw</Text>
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.ghostBtn} onPress={handleViewTransactions}>
                    <Text style={styles.ghostBtnText}>View All Transactions →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.ghostBtn} onPress={onClose}>
                    <Text style={styles.ghostBtnText}>Cancel</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    /* ─── Deposit / Withdraw Form ─── */
    const renderForm = () => (
        <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
                {transactionType === 'deposit' ? 'Deposit' : 'Withdraw'}
            </Text>
            <View style={styles.field}>
                <Text style={styles.fieldLabel}>Amount</Text>
                <TextInput
                    style={styles.input}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="e.g. 1000"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    autoFocus
                />
            </View>
            <View style={styles.field}>
                <Text style={styles.fieldLabel}>Note / Tag</Text>
                <TextInput
                    style={styles.input}
                    value={note}
                    onChangeText={setNote}
                    placeholder="e.g. Initial deposit, Winnings..."
                    placeholderTextColor="rgba(255,255,255,0.3)"
                />
            </View>
            {/* Fix #2: Both buttons have flex:1 for equal size */}
            <View style={styles.formActions}>
                <TouchableOpacity style={styles.formGhostBtn} onPress={() => { resetForm(); setView('menu'); }}>
                    <Text style={styles.ghostBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
                    <LinearGradient colors={GRADIENTS.button} style={styles.btnGradient}>
                        <Text style={styles.primaryBtnText}>Save</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            {/* Fix #1: KeyboardAvoidingView wraps everything */}
            <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
                    <TouchableOpacity activeOpacity={1} style={styles.modal}>
                        {view === 'menu' && renderMenu()}
                        {view === 'form' && renderForm()}
                    </TouchableOpacity>
                </TouchableOpacity>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '92%',
        maxWidth: 380,
        maxHeight: '80%',
        backgroundColor: '#0c0c0c',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
    },
    modalContent: {
        padding: 16,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    balanceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    balanceLabel: {
        fontSize: 12,
        color: COLORS.muted,
    },
    balanceValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.accent,
    },
    buttonGrid: {
        gap: 10,
        marginTop: 16,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    depositBtn: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    depositGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 12,
        borderRadius: 8,
    },
    depositText: {
        color: '#052018',
        fontSize: 14,
        fontWeight: '700',
    },
    withdrawBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.danger,
        backgroundColor: 'transparent',
    },
    withdrawText: {
        color: COLORS.danger,
        fontSize: 14,
        fontWeight: '600',
    },
    ghostBtn: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    /* Fix #2: Ghost button with flex:1 for form row */
    formGhostBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ghostBtnText: {
        color: COLORS.muted,
        fontSize: 14,
        fontWeight: '600',
    },
    primaryBtn: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    btnGradient: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        color: '#052018',
        fontSize: 14,
        fontWeight: '700',
    },
    formActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    field: {
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: '600',
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 8,
        padding: 10,
        fontSize: 14,
        color: COLORS.text,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
});
