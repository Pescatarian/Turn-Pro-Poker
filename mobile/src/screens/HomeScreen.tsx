import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { setActiveWallet } from '../store/slices/walletsSlice';
import { formatCents, calculateStats } from '../utils/money';
import { BankrollChart } from '../components/Chart';
import { WalletSwitcher } from '../components/WalletSwitcher';
import { TransactionsModal } from '../components/TransactionsModal';
import { SessionDetailModal } from '../components/SessionDetailModal';
import { updateSession, deleteSession } from '../store/slices/sessionsSlice';
import { Session, Transaction, Wallet } from '../types';
import {
  UserIcon,
  SearchIcon,
  EyeIcon,
  EyeOffIcon,
  ChevronRightIcon,
} from '../components/icons';

export function HomeScreen() {
  const dispatch = useDispatch();
  const [hideValues, setHideValues] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTransactions, setShowTransactions] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const { items: sessions } = useSelector((state: RootState) => state.sessions);
  const { items: wallets, activeWalletId } = useSelector((state: RootState) => state.wallets);
  const { user } = useSelector((state: RootState) => state.auth);

  const activeWallet = wallets.find(w => w.id === activeWalletId);
  const walletSessions = sessions.filter(s => s.walletId === activeWalletId);
  const stats = calculateStats(walletSessions);

  // Filter sessions by search
  const filteredSessions = searchQuery
    ? walletSessions.filter(s =>
        s.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : walletSessions;

  const handleAddWallet = (wallet: Wallet) => {
    // TODO: Dispatch add wallet action
    console.log('Add wallet:', wallet);
  };

  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
    // TODO: Dispatch to store and sync
  };

  const handleSaveSession = (session: Session) => {
    dispatch(updateSession(session));
    setSelectedSession(null);
  };

  const handleDeleteSession = (sessionId: string) => {
    dispatch(deleteSession(sessionId));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Top Navigation */}
        <View style={styles.topNav}>
          <TouchableOpacity style={styles.userAvatar}>
            <UserIcon color={colors.accent} size={18} />
          </TouchableOpacity>

          <View style={styles.searchBar}>
            <SearchIcon color={colors.muted} size={16} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search sessions..."
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

          <TouchableOpacity style={styles.coachButton}>
            <Text style={styles.coachButtonText}>Get Coach</Text>
          </TouchableOpacity>
        </View>

        {/* Wallet Switcher */}
        <WalletSwitcher
          wallets={wallets}
          activeWalletId={activeWalletId}
          onSelectWallet={(id) => dispatch(setActiveWallet(id))}
          onAddWallet={handleAddWallet}
          userId={user?.id || ''}
        />

        {/* Bankroll Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.bankrollCard}
            onPress={() => setShowTransactions(true)}
          >
            <View style={styles.bankrollInfo}>
              <Text style={styles.bankrollLabel}>CURRENT BANKROLL</Text>
              <View style={styles.bankrollValueRow}>
                <Text style={styles.bankrollValue}>
                  {hideValues ? '••••••' : formatCents(activeWallet?.balanceCents || 0)}
                </Text>
                <View style={[styles.changeIndicator, stats.netProfitCents >= 0 ? styles.upBg : styles.downBg]}>
                  <Text style={[styles.changeText, stats.netProfitCents >= 0 ? styles.up : styles.down]}>
                    {stats.netProfitCents >= 0 ? '↑' : '↓'} {formatCents(Math.abs(stats.netProfitCents))}
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRightIcon color={colors.muted} size={20} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eyeButton}
            onPress={() => setHideValues(!hideValues)}
          >
            {hideValues ? (
              <EyeOffIcon color={colors.muted} size={20} />
            ) : (
              <EyeIcon color={colors.muted} size={20} />
            )}
          </TouchableOpacity>
        </View>

        {/* Chart */}
        <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Bankroll Over Time</Text>
          <BankrollChart sessions={walletSessions} height={200} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Net Profit</Text>
            <Text style={[styles.statValue, stats.netProfitCents >= 0 ? styles.up : styles.down]}>
              {hideValues ? '••••' : formatCents(stats.netProfitCents)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>$/Hour</Text>
            <Text style={[styles.statValue, stats.hourlyRateCents >= 0 ? styles.up : styles.down]}>
              {hideValues ? '••••' : formatCents(stats.hourlyRateCents)}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total Hours</Text>
            <Text style={styles.statValue}>{stats.totalHours.toFixed(1)}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Sessions</Text>
            <Text style={styles.statValue}>{stats.sessionCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Win Rate</Text>
            <Text style={styles.statValue}>{stats.winRate.toFixed(0)}%</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Avg Session</Text>
            <Text style={[styles.statValue, stats.avgSessionCents >= 0 ? styles.up : styles.down]}>
              {hideValues ? '••••' : formatCents(stats.avgSessionCents)}
            </Text>
          </View>
        </View>

        {/* Recent Sessions */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>
            {searchQuery ? `Search Results (${filteredSessions.length})` : 'Recent Sessions'}
          </Text>
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>
                {searchQuery ? 'No sessions match your search' : 'No sessions yet'}
              </Text>
            </View>
          ) : (
            filteredSessions.slice(0, 5).map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => setSelectedSession(session)}
              >
                <View>
                  <Text style={styles.sessionLocation}>{session.location}</Text>
                  <Text style={styles.sessionDate}>
                    {new Date(session.date).toLocaleDateString()} • {session.hours}h
                    {session.bb && ` • ${session.bb}`}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.sessionProfit,
                    session.cashoutCents - session.buyinCents >= 0 ? styles.up : styles.down,
                  ]}
                >
                  {hideValues
                    ? '••••'
                    : formatCents(session.cashoutCents - session.buyinCents)}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Transactions Modal */}
      <TransactionsModal
        visible={showTransactions}
        onClose={() => setShowTransactions(false)}
        transactions={transactions}
        onAddTransaction={handleAddTransaction}
        walletId={activeWalletId || ''}
        currentBalance={activeWallet?.balanceCents || 0}
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
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(16,185,129,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    flex: 1,
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
  coachButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  coachButtonText: {
    color: '#052018',
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  bankrollCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  bankrollInfo: {
    flex: 1,
  },
  bankrollLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    fontWeight: '600',
    marginBottom: 2,
  },
  bankrollValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bankrollValue: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.accent,
  },
  changeIndicator: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  upBg: {
    backgroundColor: 'rgba(16,185,129,0.2)',
  },
  downBg: {
    backgroundColor: 'rgba(239,68,68,0.2)',
  },
  changeText: {
    fontSize: fontSize.xs,
    fontWeight: '700',
  },
  up: {
    color: colors.accent,
  },
  down: {
    color: colors.danger,
  },
  eyeButton: {
    padding: spacing.sm,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
  },
  chartSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    width: '31%',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.muted,
    marginBottom: 4,
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  recentSection: {
    marginBottom: spacing.xxl,
  },
  sessionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  sessionLocation: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  sessionDate: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  sessionProfit: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  emptyState: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: fontSize.md,
  },
});