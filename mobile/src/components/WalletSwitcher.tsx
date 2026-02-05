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
import { Wallet } from '../types';
import { formatCents } from '../utils/money';
import { generateUUID } from '../utils/uuid';
import { ChevronRightIcon } from './icons';

interface WalletSwitcherProps {
  wallets: Wallet[];
  activeWalletId: string | null;
  onSelectWallet: (walletId: string) => void;
  onAddWallet: (wallet: Wallet) => void;
  userId: string;
}

export function WalletSwitcher({
  wallets,
  activeWalletId,
  onSelectWallet,
  onAddWallet,
  userId,
}: WalletSwitcherProps) {
  const [showModal, setShowModal] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [currency, setCurrency] = useState('USD');

  const activeWallet = wallets.find(w => w.id === activeWalletId);

  const handleAddWallet = () => {
    if (!newWalletName.trim()) {
      Alert.alert('Error', 'Please enter a wallet name');
      return;
    }

    const wallet: Wallet = {
      id: generateUUID(),
      userId,
      name: newWalletName.trim(),
      currency,
      balanceCents: 0,
      createdAt: new Date().toISOString(),
    };

    onAddWallet(wallet);
    setNewWalletName('');
    setShowAddForm(false);
  };

  const renderWallet = ({ item }: { item: Wallet }) => (
    <TouchableOpacity
      style={[
        styles.walletItem,
        item.id === activeWalletId && styles.walletItemActive,
      ]}
      onPress={() => {
        onSelectWallet(item.id);
        setShowModal(false);
      }}
    >
      <View>
        <Text style={styles.walletName}>{item.name}</Text>
        <Text style={styles.walletBalance}>{formatCents(item.balanceCents)}</Text>
      </View>
      {item.id === activeWalletId && (
        <Text style={styles.activeIndicator}>✓</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Dropdown Button */}
      <TouchableOpacity
        style={styles.dropdownButton}
        onPress={() => setShowModal(true)}
      >
        <View>
          <Text style={styles.dropdownLabel}>Bankroll</Text>
          <Text style={styles.dropdownValue}>
            {activeWallet?.name || 'Select Wallet'}
          </Text>
        </View>
        <ChevronRightIcon color={colors.muted} size={20} />
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.header}>
              <Text style={styles.title}>Select Bankroll</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Wallet List */}
            <FlatList
              data={wallets}
              renderItem={renderWallet}
              keyExtractor={item => item.id}
              style={styles.list}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No wallets yet</Text>
              }
            />

            {/* Add Form */}
            {showAddForm ? (
              <View style={styles.addForm}>
                <TextInput
                  style={styles.input}
                  value={newWalletName}
                  onChangeText={setNewWalletName}
                  placeholder="Wallet name (e.g., Main Bankroll)"
                  placeholderTextColor={colors.muted}
                />
                <View style={styles.currencyRow}>
                  {['USD', 'EUR', 'GBP', 'CAD'].map(c => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.currencyButton,
                        currency === c && styles.currencyButtonActive,
                      ]}
                      onPress={() => setCurrency(c)}
                    >
                      <Text style={[
                        styles.currencyText,
                        currency === c && styles.currencyTextActive,
                      ]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.formButtons}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setShowAddForm(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleAddWallet}
                  >
                    <Text style={styles.confirmButtonText}>Create</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Text style={styles.addButtonText}>+ Add New Bankroll</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dropdownLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: 2,
  },
  dropdownValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
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
  list: {
    padding: spacing.lg,
  },
  walletItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  walletItemActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(16,185,129,0.1)',
  },
  walletName: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  walletBalance: {
    fontSize: fontSize.sm,
    color: colors.accent,
    marginTop: 2,
  },
  activeIndicator: {
    color: colors.accent,
    fontSize: fontSize.lg,
  },
  emptyText: {
    color: colors.muted,
    textAlign: 'center',
    padding: spacing.xl,
  },
  addButton: {
    marginHorizontal: spacing.lg,
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
    padding: spacing.lg,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
  },
  input: {
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.md,
    marginBottom: spacing.md,
  },
  currencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  currencyButton: {
    flex: 1,
    padding: spacing.sm,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  currencyButtonActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: colors.accent,
  },
  currencyText: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  currencyTextActive: {
    color: colors.white,
  },
  formButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
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
  confirmButtonText: {
    color: '#052018',
    fontWeight: '700',
  },
});