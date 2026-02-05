import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { Session } from '../types';
import { formatCents, dollarsToCents, centsToDollars } from '../utils/money';

interface SessionDetailModalProps {
  visible: boolean;
  session: Session | null;
  onClose: () => void;
  onSave: (session: Session) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionDetailModal({
  visible,
  session,
  onClose,
  onSave,
  onDelete,
}: SessionDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [location, setLocation] = useState('');
  const [buyin, setBuyin] = useState('');
  const [cashout, setCashout] = useState('');
  const [hours, setHours] = useState('');
  const [bb, setBb] = useState('');
  const [tips, setTips] = useState('');
  const [expenses, setExpenses] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (session) {
      setLocation(session.location);
      setBuyin(centsToDollars(session.buyinCents).toString());
      setCashout(centsToDollars(session.cashoutCents).toString());
      setHours(session.hours.toString());
      setBb(session.bb || '');
      setTips(session.tipsCents ? centsToDollars(session.tipsCents).toString() : '');
      setExpenses(session.expensesCents ? centsToDollars(session.expensesCents).toString() : '');
      setNotes(session.notes || '');
    }
  }, [session]);

  if (!session) return null;

  const profit = session.cashoutCents - session.buyinCents;
  const isProfit = profit >= 0;

  const handleSave = () => {
    const updatedSession: Session = {
      ...session,
      location,
      buyinCents: dollarsToCents(parseFloat(buyin) || 0),
      cashoutCents: dollarsToCents(parseFloat(cashout) || 0),
      hours: parseFloat(hours) || 0,
      bb: bb || undefined,
      tipsCents: tips ? dollarsToCents(parseFloat(tips)) : undefined,
      expensesCents: expenses ? dollarsToCents(parseFloat(expenses)) : undefined,
      notes: notes || undefined,
    };
    onSave(updatedSession);
    setIsEditing(false);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Session',
      'Are you sure you want to delete this session? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(session.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>{isEditing ? 'Edit Session' : 'Session Details'}</Text>
                <Text style={styles.date}>
                  {new Date(session.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Text>
              </View>
              <TouchableOpacity onPress={onClose}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Profit Display */}
            <View style={[styles.profitCard, isProfit ? styles.profitCardUp : styles.profitCardDown]}>
              <Text style={styles.profitLabel}>Profit/Loss</Text>
              <Text style={[styles.profitValue, isProfit ? styles.profitUp : styles.profitDown]}>
                {isProfit ? '+' : ''}{formatCents(profit)}
              </Text>
              <Text style={styles.profitHourly}>
                {formatCents(Math.round(profit / (session.hours || 1)))}/hr
              </Text>
            </View>

            {isEditing ? (
              /* Edit Form */
              <View style={styles.form}>
                <View style={styles.field}>
                  <Text style={styles.label}>Location</Text>
                  <TextInput
                    style={styles.input}
                    value={location}
                    onChangeText={setLocation}
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Buy-in</Text>
                    <TextInput
                      style={styles.input}
                      value={buyin}
                      onChangeText={setBuyin}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Cash-out</Text>
                    <TextInput
                      style={styles.input}
                      value={cashout}
                      onChangeText={setCashout}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Hours</Text>
                    <TextInput
                      style={styles.input}
                      value={hours}
                      onChangeText={setHours}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Stakes</Text>
                    <TextInput
                      style={styles.input}
                      value={bb}
                      onChangeText={setBb}
                      placeholder="1/2"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Tips</Text>
                    <TextInput
                      style={styles.input}
                      value={tips}
                      onChangeText={setTips}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                  <View style={[styles.field, styles.half]}>
                    <Text style={styles.label}>Expenses</Text>
                    <TextInput
                      style={styles.input}
                      value={expenses}
                      onChangeText={setExpenses}
                      keyboardType="decimal-pad"
                      placeholderTextColor={colors.muted}
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>Notes</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            ) : (
              /* View Mode */
              <View style={styles.details}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{session.location}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Buy-in</Text>
                  <Text style={styles.detailValue}>{formatCents(session.buyinCents)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Cash-out</Text>
                  <Text style={styles.detailValue}>{formatCents(session.cashoutCents)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>{session.hours} hours</Text>
                </View>
                {session.bb && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Stakes</Text>
                    <Text style={styles.detailValue}>{session.bb}</Text>
                  </View>
                )}
                {session.tipsCents && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tips</Text>
                    <Text style={styles.detailValue}>{formatCents(session.tipsCents)}</Text>
                  </View>
                )}
                {session.expensesCents && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Expenses</Text>
                    <Text style={styles.detailValue}>{formatCents(session.expensesCents)}</Text>
                  </View>
                )}
                {session.notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.detailLabel}>Notes</Text>
                    <Text style={styles.notesText}>{session.notes}</Text>
                  </View>
                )}
                {!session.syncedAt && (
                  <View style={styles.syncBadge}>
                    <Text style={styles.syncText}>⏳ Pending sync</Text>
                  </View>
                )}
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              {isEditing ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => setIsEditing(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => setIsEditing(true)}
                  >
                    <Text style={styles.editButtonText}>Edit Session</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
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
    maxHeight: '90%',
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
  },
  date: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  closeButton: {
    fontSize: fontSize.xl,
    color: colors.muted,
    padding: spacing.sm,
  },
  profitCard: {
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  profitCardUp: {
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
  },
  profitCardDown: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  profitLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  profitValue: {
    fontSize: 36,
    fontWeight: '800',
    marginVertical: 4,
  },
  profitUp: {
    color: colors.accent,
  },
  profitDown: {
    color: colors.danger,
  },
  profitHourly: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  details: {
    paddingHorizontal: spacing.lg,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  detailLabel: {
    fontSize: fontSize.md,
    color: colors.muted,
  },
  detailValue: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  notesSection: {
    paddingVertical: spacing.md,
  },
  notesText: {
    fontSize: fontSize.md,
    color: colors.white,
    marginTop: spacing.sm,
    lineHeight: 22,
  },
  syncBadge: {
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  syncText: {
    fontSize: fontSize.sm,
    color: '#f59e0b',
  },
  form: {
    paddingHorizontal: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginBottom: spacing.xs,
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  half: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  deleteButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: colors.danger,
    fontWeight: '600',
  },
  editButton: {
    flex: 2,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#052018',
    fontWeight: '700',
  },
  cancelButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.glass,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: colors.muted,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    padding: spacing.md,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#052018',
    fontWeight: '700',
  },
});