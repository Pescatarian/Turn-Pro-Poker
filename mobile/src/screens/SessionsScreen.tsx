import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { formatCents } from '../utils/money';
import { Session } from '../types';

export function SessionsScreen() {
  const { items: sessions, loading } = useSelector(
    (state: RootState) => state.sessions
  );

  const renderSession = ({ item }: { item: Session }) => {
    const profit = item.cashoutCents - item.buyinCents;
    const isProfit = profit >= 0;

    return (
      <TouchableOpacity style={styles.sessionCard}>
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionLocation}>{item.location}</Text>
          <Text style={[styles.sessionProfit, isProfit ? styles.up : styles.down]}>
            {formatCents(profit)}
          </Text>
        </View>
        <View style={styles.sessionDetails}>
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          <Text style={styles.detailText}>{item.hours}h</Text>
          {item.bb && <Text style={styles.detailText}>{item.bb}</Text>}
        </View>
        {!item.syncedAt && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingText}>Pending sync</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>{sessions.length} total</Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No sessions yet</Text>
            <Text style={styles.emptySubtext}>Tap + to add your first session</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sessionCard: {
    width: '48.5%',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  sessionLocation: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
    flex: 1,
  },
  sessionProfit: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  up: {
    color: colors.accent,
  },
  down: {
    color: colors.danger,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadge: {
    marginTop: spacing.sm,
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  pendingText: {
    fontSize: fontSize.xs,
    color: '#f59e0b',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
});