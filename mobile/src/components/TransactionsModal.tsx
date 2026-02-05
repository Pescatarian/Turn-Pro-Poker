import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { Transaction } from '../types';
import { formatCents, dollarsToCents } from '../utils/money';
import { generateUUID } from '../utils/uuid';

interface TransactionsModalProps {
  visible: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onAddTransaction: (transaction: Transaction) => void;
  walletId: string;
  currentBalance: number;
}

export function TransactionsModal({
  visible,
  onClose,
  transactions,
  onAddTransaction,
  walletId,
  currentBalance,
}: TransactionsModalProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [transactionType, setTransactionType] = useState<'deposit' | 'withdrawal'>('deposit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const handleAdd = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    const amountCents = dollarsToCents(parseFloat(amount));
    const signedAmount = transactionType === 'deposit' ? amountCents : -amountCents;

    const transaction: Transaction = {
      id: generateUUID(),
      walletId,
      amountCents: signedAmount,
      balanceAfterCents: currentBalance + signedAmount,
      transactionType,
      metadata: note ? { note } : undefined,
      createdAt: new Date().toISOString(),
    };

    onAddTransaction(transaction);
    setAmount('');
    setNote('');
    setShowAddForm(false);
  };

  const renderTransaction = ({ item }: { item: Transaction }) => {
    const isDeposit = item.amountCents > 0;
    return (
      <View style={styles.transactionItem}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionType}>
            {item.transactionType.charAt(0).toUpperCase() + item.transactionType.slice(1)}
          </Text>
          <Text style={styles.transactionDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
          {item.metadata?.note && (
            <Text style={styles.transactionNote}>{item.metadata.note}</Text>
          )}
        </View>
        <View style={styles.transactionAmounts}>
          <Text style={[styles.transactionAmount, isDeposit ? styles.positive : styles.negative]}>
            {isDeposit ? '+' : ''}{formatCents(item.amountCents)}
          </Text>
          <Text style={styles.balanceAfter}>Bal: {formatCents(item.balanceAfterCents)}</Text>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Transactions</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>{formatCents(currentBalance)}</Text>
          </View>

          {/* Add Form or Button */}
          {showAddForm ? (
            <View style={styles.addForm}>
              <View style={styles.typeToggle}>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'deposit' && styles.typeButtonActive,
                  ]}
                  onPress={() => setTransactionType('deposit')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'deposit' && styles.typeButtonTextActive,
                  ]}>Deposit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.typeButton,
                    transactionType === 'withdrawal' && styles.typeButtonActiveWithdraw,
                  ]}
                  onPress={() => setTransactionType('withdrawal')}
                >
                  <Text style={[
                    styles.typeButtonText,
                    transactionType === 'withdrawal' && styles.typeButtonTextActive,
                  ]}>Withdrawal</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                placeholder="Amount"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />

              <TextInput
                style={styles.input}
                value={note}
                onChangeText={setNote}
                placeholder="Note (optional)"
                placeholderTextColor={colors.muted}
              />

              <View style={styles.formButtons}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setShowAddForm(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    transactionType === 'withdrawal' && styles.confirmButtonWithdraw,
                  ]}
                  onPress={handleAdd}
                >
                  <Text style={styles.confirmButtonText}>
                    {transactionType === 'deposit' ? 'Add Deposit' : 'Withdraw'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddForm(true)}
            >
              <Text style={styles.addButtonText}>+ Add Transaction</Text>
            </TouchableOpacity>
          )}

          {/* Transaction List */}
          <FlatList
            data={transactions.sort((a, b) => 
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )}
            renderItem={renderTransaction}
            keyExtractor={item => item.id}
            style={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No transactions yet</Text>
            }
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  closeButton: {
    fontSize: fontSize.xl,
    color: colors.muted,
    padding: spacing.sm,
  },
  balanceCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: fontSize.hero,
    fontWeight: '800',
    color: colors.accent,
  },
  addButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  addForm: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  typeToggle: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  typeButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: colors.accent,
  },
  typeButtonActiveWithdraw: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderColor: colors.danger,
  },
  typeButtonText: {
    color: colors.muted,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: colors.white,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.md,
    marginBottom: spacing.sm,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.muted,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 2,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  confirmButtonWithdraw: {
    backgroundColor: colors.danger,
  },
  confirmButtonText: {
    color: '#052018',
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionType: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  transactionDate: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  transactionNote: {
    fontSize: fontSize.sm,
    color: colors.muted,
    fontStyle: 'italic',
    marginTop: 2,
  },
  transactionAmounts: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  positive: {
    color: colors.accent,
  },
  negative: {
    color: colors.danger,
  },
  balanceAfter: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.xl,
  },
});