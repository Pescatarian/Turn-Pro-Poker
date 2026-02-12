import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { database } from '../../../model';
import Transaction from '../../../model/Transaction';
import { Q } from '@nozbe/watermelondb';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { usePrivacy } from '../../../contexts/PrivacyContext';
import { useToast } from '../../../components/ui/ToastProvider';

export default function TransactionsScreen() {
    const router = useRouter();
    const { privacyMode } = usePrivacy();
    const { showToast } = useToast();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    const loadTransactions = useCallback(async () => {
        const txns = await database.collections
            .get('transactions')
            .query(Q.sortBy('created_at', Q.desc))
            .fetch() as Transaction[];
        setTransactions(txns);
    }, []);

    useEffect(() => {
        loadTransactions();
        const sub = database.collections.get('transactions').changes.subscribe(() => loadTransactions());
        return () => sub.unsubscribe();
    }, [loadTransactions]);

    const formatCurrency = (n: number) => {
        if (privacyMode) return '••••';
        return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date | null) => {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const handleEdit = (txn: Transaction) => {
        setEditingTransaction(txn);
        setAmount(String(txn.amount));
        setNote(txn.notes || '');
        setEditModalVisible(true);
    };

    const handleSaveEdit = async () => {
        if (!editingTransaction) return;
        const num = parseFloat(amount);
        if (isNaN(num) || num <= 0) {
            showToast('Please enter a valid positive amount.', 'error');
            return;
        }
        await database.write(async () => {
            await editingTransaction.update((txn: any) => {
                txn._setRaw('amount', num);
                txn._setRaw('notes', note.trim());
                txn._setRaw('updated_at', Date.now());
            });
        });
        setEditModalVisible(false);
        setEditingTransaction(null);
    };

    const handleDelete = async () => {
        if (!editingTransaction) return;
        Alert.alert('Delete Transaction', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete', style: 'destructive', onPress: async () => {
                    await database.write(async () => {
                        await editingTransaction.markAsDeleted();
                    });
                    setEditModalVisible(false);
                    setEditingTransaction(null);
                }
            },
        ]);
    };

    const renderTransaction = ({ item }: { item: Transaction }) => {
        const isDeposit = item.type === 'deposit';
        return (
            <TouchableOpacity style={styles.txnItem} onPress={() => handleEdit(item)} activeOpacity={0.7}>
                <View style={styles.txnLeft}>
                    <View style={[styles.txnIcon, { backgroundColor: isDeposit ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' }]}>
                        <Ionicons
                            name={isDeposit ? 'arrow-down' : 'arrow-up'}
                            size={16}
                            color={isDeposit ? COLORS.accent : COLORS.danger}
                        />
                    </View>
                    <View style={styles.txnInfo}>
                        <Text style={styles.txnType}>{isDeposit ? 'Deposit' : 'Withdrawal'}</Text>
                        {item.notes ? <Text style={styles.txnNote}>{item.notes}</Text> : null}
                        <Text style={styles.txnDate}>{formatDate(item.createdAt)}</Text>
                    </View>
                </View>
                <Text style={[styles.txnAmount, { color: isDeposit ? COLORS.accent : COLORS.danger }]}>
                    {privacyMode ? '••••' : `${isDeposit ? '+' : '-'}${formatCurrency(item.amount)}`}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <ScreenWrapper hideHeader>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={22} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Transactions</Text>
                <View style={{ width: 34 }} />
            </View>

            {transactions.length === 0 ? (
                <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={48} color={COLORS.muted} />
                    <Text style={styles.emptyText}>No transactions yet</Text>
                    <Text style={styles.emptySubtext}>Deposit or withdraw from the dashboard</Text>
                </View>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={item => item.id}
                    renderItem={renderTransaction}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}

            {/* Edit Transaction Modal */}
            <Modal visible={editModalVisible} transparent animationType="fade" onRequestClose={() => setEditModalVisible(false)}>
                <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                    <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setEditModalVisible(false)}>
                        <TouchableOpacity activeOpacity={1} style={styles.modal}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Edit Transaction</Text>
                                <View style={styles.field}>
                                    <Text style={styles.fieldLabel}>Amount</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={amount}
                                        onChangeText={setAmount}
                                        placeholder="e.g. 1000"
                                        placeholderTextColor="rgba(255,255,255,0.3)"
                                        keyboardType="numeric"
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
                                <View style={styles.formActions}>
                                    <TouchableOpacity style={styles.dangerBtn} onPress={handleDelete}>
                                        <LinearGradient colors={GRADIENTS.dangerButton} style={styles.btnGradient}>
                                            <Text style={styles.dangerBtnText}>Delete</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.ghostBtn} onPress={() => setEditModalVisible(false)}>
                                        <Text style={styles.ghostBtnText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity style={styles.primaryBtn} onPress={handleSaveEdit}>
                                        <LinearGradient colors={GRADIENTS.button} style={styles.btnGradient}>
                                            <Text style={styles.primaryBtnText}>Save</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </KeyboardAvoidingView>
            </Modal>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backBtn: {
        width: 34,
        height: 34,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },
    txnItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
        marginBottom: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    txnLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    txnIcon: {
        width: 32,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    txnInfo: {
        flex: 1,
    },
    txnType: {
        fontSize: 13,
        fontWeight: '700',
        color: COLORS.text,
    },
    txnNote: {
        fontSize: 12,
        color: COLORS.muted,
        marginTop: 3,
    },
    txnDate: {
        fontSize: 11,
        color: COLORS.muted,
        marginTop: 2,
    },
    txnAmount: {
        fontSize: 16,
        fontWeight: '800',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingBottom: 80,
    },
    emptyText: {
        color: COLORS.text,
        fontWeight: '600',
        marginTop: 12,
        fontSize: 16,
    },
    emptySubtext: {
        color: COLORS.muted,
        fontSize: 13,
        marginTop: 4,
    },
    // Modal styles
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modal: {
        width: '92%',
        maxWidth: 380,
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
    formActions: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    ghostBtn: {
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
    dangerBtn: {
        flex: 1,
        borderRadius: 8,
        overflow: 'hidden',
    },
    dangerBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
});
