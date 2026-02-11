import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useSync } from '../../contexts/SyncContext';
import { useRouter } from 'expo-router';
import { database } from '../../model';
import Session from '../../model/Session';
import { Q } from '@nozbe/watermelondb';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { BankrollChart, ChartXAxisMode } from '../../components/dashboard/BankrollChart';
import Svg, { Circle, Path, Line } from 'react-native-svg';

export default function Dashboard() {
    const { user } = useAuth();
    const { triggerSync } = useSync();
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [privacyMode, setPrivacyMode] = useState(false);
    const [chartXAxisMode, setChartXAxisMode] = useState<ChartXAxisMode>('sessions');

    // Stats state
    const [bankroll, setBankroll] = useState(5000);
    const [bankrollChange, setBankrollChange] = useState(0);
    const [bankrollTrend, setBankrollTrend] = useState(0);
    const [totalProfit, setTotalProfit] = useState(0);
    const [netProfit, setNetProfit] = useState(0);
    const [winrateBB100, setWinrateBB100] = useState(0);
    const [netWinrateBB100, setNetWinrateBB100] = useState(0);
    const [hoursPlayed, setHoursPlayed] = useState(0);
    const [dollarPerHour, setDollarPerHour] = useState(0);
    const [netDollarPerHour, setNetDollarPerHour] = useState(0);
    const [sessionsPlayed, setSessionsPlayed] = useState(0);
    const [avgSessionLength, setAvgSessionLength] = useState(0);
    const [tips, setTips] = useState(0);
    const [tipsBB100, setTipsBB100] = useState(0);
    const [expenses, setExpenses] = useState(0);
    const [expensesBB100, setExpensesBB100] = useState(0);
    const [chartData, setChartData] = useState<any[]>([]);
    const [netChartData, setNetChartData] = useState<any[]>([]);
    const [rawSessions, setRawSessions] = useState<Session[]>([]);

    const buildChartData = useCallback((sessions: Session[], mode: ChartXAxisMode) => {
        let runningTotal = 0;
        let runningNet = 0;
        const cData: any[] = [{ value: 0, label: mode === 'sessions' ? 'S0' : mode === 'hours' ? '0h' : '0' }];
        const nData: any[] = [{ value: 0 }];

        let cumulativeHours = 0;

        sessions.forEach((s, i) => {
            runningTotal += s.profit;
            runningNet += s.profit - (s.tips || 0) - (s.expenses || 0);
            cumulativeHours += s.durationHours;

            let label: string;
            if (mode === 'sessions') {
                label = `S${i + 1}`;
            } else if (mode === 'hours') {
                label = `${cumulativeHours.toFixed(0)}h`;
            } else {
                // Approximate 25 hands/hour for live poker
                const hands = Math.round(cumulativeHours * 25);
                label = `${hands}`;
            }

            cData.push({ value: runningTotal, label });
            nData.push({ value: runningNet });
        });

        setChartData(cData);
        setNetChartData(nData);
    }, []);

    const loadData = async () => {
        const sessions = await database.collections.get('sessions').query(
            Q.sortBy('start_time', Q.asc)
        ).fetch() as Session[];

        setRawSessions(sessions);

        // Calculate stats
        const profit = sessions.reduce((sum, s) => sum + s.profit, 0);
        const hours = sessions.reduce((sum, s) => sum + s.durationHours, 0);
        const tipsTotal = sessions.reduce((sum, s) => sum + (s.tips || 0), 0);
        const expensesTotal = sessions.reduce((sum, s) => sum + (s.expenses || 0), 0);
        const net = profit - tipsTotal - expensesTotal;

        setTotalProfit(profit);
        setNetProfit(net);
        setHoursPlayed(hours);
        setSessionsPlayed(sessions.length);
        setAvgSessionLength(sessions.length > 0 ? hours / sessions.length : 0);
        setDollarPerHour(hours > 0 ? profit / hours : 0);
        setNetDollarPerHour(hours > 0 ? net / hours : 0);
        setTips(tipsTotal);
        setExpenses(expensesTotal);

        // Calculate bankroll change (profit is the change)
        setBankrollChange(profit);
        setBankrollTrend(bankroll > 0 ? (profit / bankroll) * 100 : 0);

        // bb/100 calculations (assuming average $2 big blind)
        const avgBB = 2; // Would come from stakes
        const handsPlayed = hours * 25; // Approx 25 hands/hour live
        if (handsPlayed > 0) {
            setWinrateBB100((profit / avgBB) / (handsPlayed / 100));
            setNetWinrateBB100((net / avgBB) / (handsPlayed / 100));
            setTipsBB100(-(tipsTotal / avgBB) / (handsPlayed / 100));
            setExpensesBB100(-(expensesTotal / avgBB) / (handsPlayed / 100));
        }

        // Build chart data with current mode
        buildChartData(sessions, chartXAxisMode);
    };

    useEffect(() => {
        // Initial load
        loadData();

        // Subscribe to session changes using WatermelonDB observables
        const subscription = database.collections
            .get('sessions')
            .changes
            .subscribe(() => {
                // Reload data whenever sessions change (create, update, delete)
                loadData();
            });

        // Cleanup subscription on unmount
        return () => subscription.unsubscribe();
    }, []);

    // Rebuild chart labels when mode changes
    useEffect(() => {
        if (rawSessions.length > 0) {
            buildChartData(rawSessions, chartXAxisMode);
        }
    }, [chartXAxisMode, rawSessions, buildChartData]);

    const toggleChartXAxis = useCallback(() => {
        setChartXAxisMode(prev => {
            if (prev === 'sessions') return 'hours';
            if (prev === 'hours') return 'hands';
            return 'sessions';
        });
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadData(),
            triggerSync()
        ]);
        setRefreshing(false);
    };

    const formatValue = (value: number, prefix = '$', decimals = 1) => {
        if (privacyMode) return '••••';
        return `${prefix}${value.toFixed(decimals)}`;
    };

    const formatBB = (value: number) => {
        if (privacyMode) return '•••• bb/100';
        return `${value.toFixed(1)} bb/100`;
    };

    // User Avatar SVG
    const UserIcon = () => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={8} r={4} stroke={COLORS.accent} strokeWidth={2} />
            <Path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );

    // Search Icon SVG
    const SearchIcon = () => (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M21 21l-4.35-4.35" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={11} cy={11} r={6} stroke={COLORS.muted} strokeWidth={2} />
        </Svg>
    );

    // Eye Icon SVG
    const EyeIcon = () => (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={12} cy={12} r={3} stroke={COLORS.muted} strokeWidth={2} />
        </Svg>
    );

    // Chevron Right SVG
    const ChevronRight = () => (
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
            <Path d="M9 18l6-6-6-6" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );

    return (
        <ScreenWrapper>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
            >
                {/* Bankroll Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.bankrollCard}>
                        <View style={styles.bankrollInfo}>
                            <Text style={styles.bankrollLabel}>Bankroll</Text>
                            <View style={styles.bankrollValueRow}>
                                <Text style={styles.bankrollValue}>
                                    {privacyMode ? '••••••' : `$${(bankroll + bankrollChange).toLocaleString()}`}
                                </Text>
                                <Text style={[styles.bankrollChange, { color: bankrollChange >= 0 ? COLORS.accent : COLORS.danger }]}>
                                    {bankrollChange >= 0 ? '↗' : '↘'} {privacyMode ? '••••' : `${bankrollChange >= 0 ? '+' : ''}$${bankrollChange.toFixed(0)}`}
                                </Text>
                                <Text style={[styles.bankrollTrend, { color: bankrollTrend >= 0 ? COLORS.accent : COLORS.danger }]}>
                                    {privacyMode ? '••••' : `${bankrollTrend >= 0 ? '+' : ''}${bankrollTrend.toFixed(1)}%`}
                                </Text>
                            </View>
                        </View>
                        <ChevronRight />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.eyeBtn} onPress={() => setPrivacyMode(!privacyMode)}>
                        <EyeIcon />
                    </TouchableOpacity>
                </View>

                {/* Chart */}
                <BankrollChart
                    data={chartData}
                    netData={netChartData}
                    xAxisMode={chartXAxisMode}
                    onToggleXAxis={toggleChartXAxis}
                />

                {/* Stats Grid - 2x4 */}
                <View style={styles.statsGrid}>
                    {/* Row 1: Total Profit | Winrate */}
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Total Profit</Text>
                        <Text style={[styles.statValue, { color: totalProfit >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                            {formatValue(totalProfit, '$', 1)}
                        </Text>
                        <Text style={[styles.statSecondary, { color: netProfit >= 0 ? COLORS.accent : COLORS.danger }]}>
                            Net: {formatValue(netProfit, '$', 1)}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Winrate</Text>
                        <Text style={[styles.statValue, { color: winrateBB100 >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                            {formatBB(winrateBB100)}
                        </Text>
                        <Text style={[styles.statSecondary, { color: netWinrateBB100 >= 0 ? COLORS.accent : COLORS.danger }]}>
                            Net: {formatBB(netWinrateBB100)}
                        </Text>
                    </GlassCard>

                    {/* Row 2: Hours Played | $/Hour */}
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Hours Played</Text>
                        <Text style={styles.statValue}>
                            {privacyMode ? '••••' : hoursPlayed.toFixed(1)}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>$/Hour</Text>
                        <Text style={[styles.statValue, { color: dollarPerHour >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                            {formatValue(dollarPerHour, '$', 1)}
                        </Text>
                        <Text style={[styles.statSecondary, { color: netDollarPerHour >= 0 ? COLORS.accent : COLORS.danger }]}>
                            Net: {formatValue(netDollarPerHour, '$', 1)}
                        </Text>
                    </GlassCard>

                    {/* Row 3: Sessions Played | Avg Session Length */}
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Sessions Played</Text>
                        <Text style={styles.statValue}>
                            {privacyMode ? '••••' : sessionsPlayed}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Avg Session Length</Text>
                        <Text style={styles.statValue}>
                            {privacyMode ? '••••' : `${avgSessionLength.toFixed(1)}h`}
                        </Text>
                    </GlassCard>

                    {/* Row 4: Tips | Other Expenses */}
                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Tips</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>
                            {formatValue(tips, '$', 1)}
                        </Text>
                        <Text style={[styles.statSecondary, { color: COLORS.danger }]}>
                            {privacyMode ? '•••• bb/100' : `${tipsBB100.toFixed(1)} bb/100`}
                        </Text>
                    </GlassCard>

                    <GlassCard style={styles.statCard}>
                        <Text style={styles.statLabel}>Other Expenses</Text>
                        <Text style={[styles.statValue, { color: COLORS.danger }]}>
                            {formatValue(expenses, '$', 1)}
                        </Text>
                        <Text style={[styles.statSecondary, { color: COLORS.danger }]}>
                            {privacyMode ? '•••• bb/100' : `${expensesBB100.toFixed(1)} bb/100`}
                        </Text>
                    </GlassCard>
                </View>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 12,
        paddingBottom: 80,
    },
    // Top Navigation
    topNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
        padding: 10,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.02)',
    },
    userAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(16,185,129,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        paddingHorizontal: 12,
        height: 36,
        borderRadius: 8,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
    },
    getCoachBtn: {
        paddingHorizontal: 12,
        height: 32,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    getCoachText: {
        color: '#052018',
        fontWeight: '700',
        fontSize: 12,
    },
    // Bankroll Header
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    bankrollCard: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: 'rgba(16,185,129,0.2)',
    },
    bankrollInfo: {
        flex: 1,
    },
    bankrollLabel: {
        fontSize: 10,
        color: COLORS.muted,
        fontWeight: '600',
        marginBottom: 2,
    },
    bankrollValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    bankrollValue: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.accent,
    },
    bankrollChange: {
        fontSize: 11,
        fontWeight: '700',
    },
    bankrollTrend: {
        fontSize: 11,
        fontWeight: '700',
    },
    eyeBtn: {
        padding: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    // Stats Grid
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 12,
    },
    statCard: {
        width: '48%',
        flexGrow: 1,
        padding: 14,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.muted,
        marginBottom: 6,
        fontWeight: '400',
    },
    statValue: {
        fontSize: 22,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    statSecondary: {
        fontSize: 14,
        marginTop: 4,
        fontWeight: '400',
    },
});
