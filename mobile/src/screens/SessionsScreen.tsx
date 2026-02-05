import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { updateSession, deleteSession } from '../store/slices/sessionsSlice';
import { formatCents } from '../utils/money';
import { Session } from '../types';
import { SessionDetailModal } from '../components/SessionDetailModal';
import { SearchIcon } from '../components/icons';

export function SessionsScreen() {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'profit' | 'hours'>('date');

  const { items: sessions, loading } = useSelector(
    (state: RootState) => state.sessions
  );
  const { activeWalletId } = useSelector((state: RootState) => state.wallets);

  // Filter by wallet and search
  let filteredSessions = sessions.filter(s => s.walletId === activeWalletId);

  if (searchQuery) {
    filteredSessions = filteredSessions.filter(s =>
      s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.bb?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Sort sessions
  filteredSessions = [...filteredSessions].sort((a, b) => {
    switch (sortBy) {
      case 'profit':
        return (b.cashoutCents - b.buyinCents) - (a.cashoutCents - a.buyinCents);
      case 'hours':
        return b.hours - a.hours;
      case 'date':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  const handleSaveSession = (session: Session) => {
    dispatch(updateSession(session));
    setSelectedSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    dispatch(deleteSession(sessionId));
  };

  const renderSession = ({ item }: { item: Session }) => {
    const profit = item.cashoutCents - item.buyinCents;
    const isProfit = profit >= 0;

    return (
      <TouchableOpacity
        style={styles.sessionCard}
        onPress={() => setSelectedSession(item)}
      >
        <View style={styles.sessionHeader}>
          <Text style={styles.sessionLocation} numberOfLines={1}>{item.location}</Text>
          <Text style={[styles.sessionProfit, isProfit ? styles.up : styles.down]}>
            {formatCents(profit)}
          </Text>
        </View>
        <View style={styles.sessionDetails}>
          <Text style={styles.detailText}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </Text>
          <Text style={styles.detailText}>{item.hours}h</Text>
          {item.bb && <Text style={styles.detailText}>{item.bb}</Text>}
        </View>
        <View style={styles.sessionMeta}>
          <Text style={styles.metaText}>
            {formatCents(Math.round(profit / (item.hours || 1)))}/hr
          </Text>
          {!item.syncedAt && (
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>Pending</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sessions</Text>
        <Text style={styles.subtitle}>{filteredSessions.length} total</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <SearchIcon color={colors.muted} size={16} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location, stakes, notes..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearch}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortLabel}>Sort by:</Text>
        {(['date', 'profit', 'hours'] as const).map(option => (
          <TouchableOpacity
            key={option}
            style={[styles.sortButton, sortBy === option && styles.sortButtonActive]}
            onPress={() => setSortBy(option)}
          >
            <Text style={[styles.sortButtonText, sortBy === option && styles.sortButtonTextActive]}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredSessions}
        renderItem={renderSession}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No sessions match your search' : 'No sessions yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery ? 'Try a different search term' : 'Tap + to add your first session'}
            </Text>
          </View>
        }
      />

      {/* Session Detail Modal */}
      <SessionDetailModal
        visible={selectedSession !== null}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onSave={handleSaveSession}
        onDelete={handleDeleteSession}
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontSize: fontSize.sm,
  },
  clearSearch: {
    color: colors.muted,
    fontSize: fontSize.sm,
    padding: 4,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sortLabel: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  sortButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  sortButtonActive: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderColor: colors.accent,
  },
  sortButtonText: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  sortButtonTextActive: {
    color: colors.accent,
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
    marginRight: spacing.xs,
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
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: fontSize.xs,
    color: colors.muted,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sessionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaText: {
    fontSize: fontSize.xs,
    color: colors.muted,
  },
  pendingBadge: {
    backgroundColor: 'rgba(245,158,11,0.1)',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
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