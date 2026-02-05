import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useDispatch, useSelector } from 'react-redux';
import { addSession } from '../store/slices/sessionsSlice';
import { RootState } from '../store';
import { Session } from '../types';
import { generateUUID } from '../utils/uuid';
import { dollarsToCents } from '../utils/money';

export function AddSessionScreen() {
  const dispatch = useDispatch();
  const { activeWalletId } = useSelector((state: RootState) => state.wallets);

  const [location, setLocation] = useState('');
  const [buyin, setBuyin] = useState('');
  const [cashout, setCashout] = useState('');
  const [hours, setHours] = useState('');
  const [bb, setBb] = useState('');
  const [tips, setTips] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!location || !buyin || !cashout || !hours) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const session: Session = {
      id: generateUUID(),
      walletId: activeWalletId || '',
      date: new Date().toISOString(),
      location,
      buyinCents: dollarsToCents(parseFloat(buyin)),
      cashoutCents: dollarsToCents(parseFloat(cashout)),
      hours: parseFloat(hours),
      bb: bb || undefined,
      tipsCents: tips ? dollarsToCents(parseFloat(tips)) : undefined,
      expensesCents: expenses ? dollarsToCents(parseFloat(expenses)) : undefined,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
      // syncedAt is undefined - will sync when online
    };

    dispatch(addSession(session));
    
    // Reset form
    setLocation('');
    setBuyin('');
    setCashout('');
    setHours('');
    setBb('');
    setTips('');
    setExpenses('');
    setNotes('');

    Alert.alert('Success', 'Session saved! Will sync when online.');
  };

  const profit = (parseFloat(cashout) || 0) - (parseFloat(buyin) || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Add Session</Text>

        {/* Live Profit Preview */}
        {buyin && cashout && (
          <View style={styles.profitPreview}>
            <Text style={styles.profitLabel}>Profit/Loss</Text>
            <Text style={[styles.profitValue, profit >= 0 ? styles.up : styles.down]}>
              ${profit >= 0 ? '+' : ''}{profit.toFixed(2)}
            </Text>
          </View>
        )}

        {/* Required Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required</Text>
          
          <View style={styles.field}>
            <Text style={styles.label}>Location *</Text>
            <TextInput
              style={styles.input}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Bellagio, Home Game"
              placeholderTextColor={colors.muted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Buy-in *</Text>
              <TextInput
                style={styles.input}
                value={buyin}
                onChangeText={setBuyin}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Cash-out *</Text>
              <TextInput
                style={styles.input}
                value={cashout}
                onChangeText={setCashout}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Hours *</Text>
              <TextInput
                style={styles.input}
                value={hours}
                onChangeText={setHours}
                placeholder="0.0"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Stakes</Text>
              <TextInput
                style={styles.input}
                value={bb}
                onChangeText={setBb}
                placeholder="1/2, 2/5"
                placeholderTextColor={colors.muted}
              />
            </View>
          </View>
        </View>

        {/* Optional Fields */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Optional</Text>

          <View style={styles.row}>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Tips</Text>
              <TextInput
                style={styles.input}
                value={tips}
                onChangeText={setTips}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
            <View style={[styles.field, styles.half]}>
              <Text style={styles.label}>Expenses</Text>
              <TextInput
                style={styles.input}
                value={expenses}
                onChangeText={setExpenses}
                placeholder="0.00"
                placeholderTextColor={colors.muted}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Session notes..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Session</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.white,
    marginVertical: spacing.lg,
  },
  profitPreview: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  profitLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: 4,
  },
  profitValue: {
    fontSize: fontSize.hero,
    fontWeight: '800',
  },
  up: {
    color: colors.accent,
  },
  down: {
    color: colors.danger,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.md,
    textTransform: 'uppercase',
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.white,
    marginBottom: spacing.xs,
    fontWeight: '500',
  },
  input: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.md,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: 100,
  },
  saveButtonText: {
    color: '#052018',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});