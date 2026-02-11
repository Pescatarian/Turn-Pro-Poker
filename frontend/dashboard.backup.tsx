import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import Svg, { Path } from 'react-native-svg';
import { useSync } from '../../contexts/SyncContext';
import { useRouter } from 'expo-router';
import { database } from '../../model';
import Session from '../../model/Session';
import Transaction from '../../model/Transaction';
import { Q } from '@nozbe/watermelondb';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { BankrollChart, ChartXAxisMode } from '../../components/dashboard/BankrollChart';
import { BankrollModal } from '../../components/dashboard/BankrollModal';
import { FilterChips, TimeRange } from '../../components/dashboard/FilterChips';
import { usePrivacy } from '../../contexts/PrivacyContext';

export default function Dashboard() {
    const { user } = useAuth();
    const { triggerSync } = useSync();
    const router = useRouter();
    const { privacyMode, togglePrivacy } = usePrivacy();
    const [refreshing, setRefreshing] = useState(false);
    const [chartXAxisMode, setChartXAxisMode] = useState<ChartXAxisMode>('sessions');
    const [bankrollModalVisible, setBankrollModalVisible] = useState(false);

    // Filter state
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all');
    const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

    // Stats state
    const [bankroll, setBankroll] = useState(0);
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

    const getTimeRangeStart = useCallback((range: TimeRange): number | null => {
        if (range === 'all') return null;
        const now = new Date();
        switch (range) {
            case 'week': {
                const d = new Date(now);
                d.setDate(d.getDate() - 7);
                return d.getTime();
            }
            case 'month': {
                const d = new Date(now);
                d.setMonth(d.getMonth() - 1);
                return d.getTime();
            }
            case '3months': {
                const d = new Date(now);
                d.setMonth(d.getMonth() - 3);
                return d.getTime();
            }
            case 'year': {
                const d = new Date(now);
                d.setFullYear(d.getFullYear() - 1);
                return d.getTime();
            }
            default: return null;
        }
    }, []);

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
                const hands = Math.round(cumulativeHours * 25);
                label = `${hands}`;
            }

            cData.push({ value: runningTotal, label });
            nData.push({ value: runningNet });
        });

        setChartData(cData);
        setNetChartData(nData);
    }, []);

    const loadBankroll = useCallback(async () => {
        const txns = await database.collections
            .get('transactions')
            .query()
            .fetch() as Transaction[];

        let total = 0;
        txns.forEach(t => {
            if (t.type === 'deposit') total += (t.amount || 0);
            else if (t.type === 'withdrawal') total -= (t.amount || 0);
        });
        setBankroll(total);
        return total;
    }, []);

    const loadData = useCallback(async () => {
        // Build query conditions
        const conditions: any[] = [Q.sortBy('start_time', Q.asc)];

        const timeStart = getTimeRangeStart(selectedTimeRange);
        if (timeStart) {
            conditions.push(Q.where('start_time', Q.gte(timeStart)));
        }

        if (selectedVenue) {
            conditions.push(Q.where('location', selectedVenue));
        }

        const sessions = await database.collections.get('sessions').query(
            ...conditions
        ).fetch() as Session[];

        setRawSessions(sessions);

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

        const currentBankroll = await loadBankroll();
        setBankrollChange(profit);
        setBankrollTrend(currentBankroll > 0 ? (profit / currentBankroll) * 100 : 0);

        const avgBB = 2;
        const handsPlayed = hours * 25;
        if (handsPlayed > 0) {
            setWinrateBB100((profit / avgBB) / (handsPlayed / 100));
            setNetWinrateBB100((net / avgBB) / (handsPlayed / 100));
            setTipsBB100(-(tipsTotal / avgBB) / (handsPlayed / 100));
            setExpensesBB100(-(expensesTotal / avgBB) / (handsPlayed / 100));
        } else {
            setWinrateBB100(0);
            setNetWinrateBB100(0);
            setTipsBB100(0);
            setExpensesBB100(0);
        }

        buildChartData(sessions, chartXAxisMode);
    }, [selectedTimeRange, selectedVenue, chartXAxisMode, buildChartData, getTimeRangeStart, loadBankroll]);

    useEffect(() => {
        loadData();
        const sessionSub = database.collections
            .get('sessions')
            .changes
            .subscribe(() => { loadData(); });
        const txnSub = database.collections
            .get('transactions')
            .changes
            .subscribe(() => { loadBankroll(); });
        return () => { sessionSub.unsubscribe(); txnSub.unsubscribe(); };
    }, [loadData, loadBankroll]);

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
        await Promise.all([loadData(), triggerSync()]);
        setRefreshing(false);
    };

    const fmtVal = (value: number, prefix = '$', decimals = 0) => {
        if (privacyMode) return '••••';
        return `${prefix}${value.toFixed(decimals)}`;
    };

    const fmtBB = (value: number) => {
        if (privacyMode) return '••••';
        return `${value.toFixed(1)}`;
    };

    const currentBankrollDisplay = bankroll + bankrollChange;

    const filterChipsElement = (
        <FilterChips
            selectedTimeRange={selectedTimeRange}
            onTimeRangeChange={setSelectedTimeRange}
            selectedVenue={selectedVenue}
            onVenueChange={setSelectedVenue}
        />
    );

    return (
        <ScreenWrapper headerContent={filterChipsElement}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.accent} />}
                showsVerticalScrollIndicator={false}
            >
                {/* Bankroll Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.bankrollCard} onPress={() => setBankrollModalVisible(true)}>
                        <View style={styles.bankrollInfo}>
                            <Text style={styles.bankrollLabel}>Bankroll</Text>
                            <View style={styles.bankrollValueRow}>
                                <Text style={styles.bankrollValue}>
                                    {privacyMode ? '••••••' : `$${currentBankrollDisplay.toLocaleString()}`}
                                </Text>
                                <Text style={[styles.bankrollChange, { color: bankrollChange >= 0 ? COLORS.accent : COLORS.danger }]}>
                                    {bankrollChange >= 0 ? '↗' : '↘'} {privacyMode ? '••••' : `${bankrollChange >= 0 ? '+' : ''}$${bankrollChange.toFixed(0)}`}
                                </Text>
                                <Text style={[styles.bankrollTrend, { color: bankrollTrend >= 0 ? COLORS.accent : COLORS.danger }]}>
                                    {privacyMode ? '••••' : `${bankrollTrend >= 0 ? '+' : ''}${bankrollTrend.toFixed(1)}%`}
                                </Text>
                            </View>
                        </View>
                        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                            <Path d="M9 18l6-6-6-6" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.eyeBtn} onPress={togglePrivacy}>
                        <Ionicons
                            name={privacyMode ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={COLORS.muted}
                        />
                    </TouchableOpacity>
                </View>

                {/* Chart */}
                <BankrollChart
                    data={chartData}
                    netData={netChartData}
                    xAxisMode={chartXAxisMode}
                    onToggleXAxis={toggleChartXAxis}
                />

                {/* Stats Row 1: Profit | $/hr | Winrate */}
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statsRowInner}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Total Profit</Text>
                            <Text style={[styles.statValue, { color: totalProfit >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                                {fmtVal(totalProfit)}
                            </Text>
                            <Text style={[styles.statSub, { color: netProfit >= 0 ? COLORS.accent : COLORS.danger }]}>
                                Net {fmtVal(netProfit)}
                            </Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>$/Hour</Text>
                            <Text style={[styles.statValue, { color: dollarPerHour >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                                {fmtVal(dollarPerHour, '$', 1)}
                            </Text>
                            <Text style={[styles.statSub, { color: netDollarPerHour >= 0 ? COLORS.accent : COLORS.danger }]}>
                                Net {fmtVal(netDollarPerHour, '$', 1)}
                            </Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Winrate</Text>
                            <Text style={[styles.statValue, { color: winrateBB100 >= 0 ? COLORS.chartGold : COLORS.danger }]}>
                                {fmtBB(winrateBB100)}
                            </Text>
                            <Text style={[styles.statSub, { color: netWinrateBB100 >= 0 ? COLORS.accent : COLORS.danger }]}>
                                Net {fmtBB(netWinrateBB100)}
                            </Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Stats Row 2: Sessions | Hours | Avg Length */}
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statsRowInner}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Sessions</Text>
                            <Text style={styles.statValue}>
                                {privacyMode ? '••••' : sessionsPlayed}
                            </Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Hours</Text>
                            <Text style={styles.statValue}>
                                {privacyMode ? '••••' : hoursPlayed.toFixed(1)}
                            </Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Avg Length</Text>
                            <Text style={styles.statValue}>
                                {privacyMode ? '••••' : `${avgSessionLength.toFixed(1)}h`}
                            </Text>
                        </View>
                    </View>
                </GlassCard>

                {/* Stats Row 3: Tips | Expenses */}
                <GlassCard style={styles.statsCard}>
                    <View style={styles.statsRowInner}>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Tips</Text>
                            <Text style={[styles.statValue, { color: COLORS.danger }]}>
                                {fmtVal(tips)}
                            </Text>
                            <Text style={[styles.statSub, { color: COLORS.danger }]}>
                                {privacyMode ? '••••' : `${tipsBB100.toFixed(1)} bb/100`}
                            </Text>
                        </View>
                        <View style={styles.statCol}>
                            <Text style={styles.statLabel}>Expenses</Text>
                            <Text style={[styles.statValue, { color: COLORS.danger }]}>
                                {fmtVal(expenses)}
                            </Text>
                            <Text style={[styles.statSub, { color: COLORS.danger }]}>
                                {privacyMode ? '••••' : `${expensesBB100.toFixed(1)} bb/100`}
                            </Text>
                        </View>
                    </View>
                </GlassCard>
            </ScrollView>

            {/* Bankroll Modal */}
            <BankrollModal
                visible={bankrollModalVisible}
                onClose={() => setBankrollModalVisible(false)}
                currentBankroll={currentBankrollDisplay}
                onTransactionSaved={loadData}
            />
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
        padding: 8,
        paddingHorizontal: 12,
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
    // Stats Rows
    statsCard: {
        padding: 14,
        marginBottom: 8,
    },
    statsRowInner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 2,
    },
    statLabel: {
        fontSize: 11,
        color: COLORS.muted,
        fontWeight: '400',
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
        marginBottom: 2,
    },
    statSub: {
        fontSize: 13,
        fontWeight: '400',
        marginTop: 4,
    },
});
