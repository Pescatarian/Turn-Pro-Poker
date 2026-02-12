import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { database } from '../../model';
import Session from '../../model/Session';
import { Q } from '@nozbe/watermelondb';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { BankrollChart, ChartXAxisMode } from '../../components/dashboard/BankrollChart';
import { FilterChips, TimeRange } from '../../components/dashboard/FilterChips';
import { COLORS } from '../../constants/theme';
import { usePrivacy } from '../../contexts/PrivacyContext';
import { useSync } from '../../contexts/SyncContext';
import { DashboardSkeleton } from '../../components/ui/SkeletonLoader';

export default function StatsScreen() {
    const { privacyMode } = usePrivacy();
    const { triggerSync } = useSync();

    // Filter state
    const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('all');
    const [selectedVenue, setSelectedVenue] = useState<string | null>(null);

    // Chart x-axis
    const [chartXAxisMode, setChartXAxisMode] = useState<ChartXAxisMode>('sessions');

    // Data
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const getTimeRangeStart = useCallback((range: TimeRange): number | null => {
        if (range === 'all') return null;
        const now = new Date();
        switch (range) {
            case 'week': { const d = new Date(now); d.setDate(d.getDate() - 7); return d.getTime(); }
            case 'month': { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.getTime(); }
            case '3months': { const d = new Date(now); d.setMonth(d.getMonth() - 3); return d.getTime(); }
            case 'year': { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.getTime(); }
            default: return null;
        }
    }, []);

    const loadData = useCallback(async () => {
        const conditions: any[] = [Q.sortBy('start_time', Q.asc)];
        const timeStart = getTimeRangeStart(selectedTimeRange);
        if (timeStart) conditions.push(Q.where('start_time', Q.gte(timeStart)));
        if (selectedVenue) conditions.push(Q.where('location', selectedVenue));

        const result = await database.collections
            .get('sessions')
            .query(...conditions)
            .fetch() as Session[];
        setSessions(result);
        setLoading(false);
    }, [selectedTimeRange, selectedVenue, getTimeRangeStart]);

    useEffect(() => {
        loadData();
        const sub = database.collections.get('sessions').changes.subscribe(() => loadData());
        return () => sub.unsubscribe();
    }, [loadData]);

    const stats = useMemo(() => {
        let totalProfit = 0;
        let totalHours = 0;
        let tipsTotal = 0;
        let expensesTotal = 0;
        let winSessions = 0;

        for (const s of sessions) {
            totalProfit += s.profit;
            totalHours += s.durationHours;
            tipsTotal += s.tips || 0;
            expensesTotal += s.expenses || 0;
            if (s.profit > 0) winSessions++;
        }

        const netProfit = totalProfit - tipsTotal - expensesTotal;
        const avgBB = 2;
        const handsPlayed = totalHours * 25;

        return {
            totalProfit,
            netProfit,
            totalHours,
            hourlyRate: totalHours > 0 ? totalProfit / totalHours : 0,
            netHourlyRate: totalHours > 0 ? netProfit / totalHours : 0,
            sessionsPlayed: sessions.length,
            winRate: sessions.length > 0 ? (winSessions / sessions.length) * 100 : 0,
            avgSessionLength: sessions.length > 0 ? totalHours / sessions.length : 0,
            tips: tipsTotal,
            expenses: expensesTotal,
            winrateBB100: handsPlayed > 0 ? (totalProfit / avgBB) / (handsPlayed / 100) : 0,
            netWinrateBB100: handsPlayed > 0 ? (netProfit / avgBB) / (handsPlayed / 100) : 0,
        };
    }, [sessions]);

    // Chart data
    const { chartData, netChartData } = useMemo(() => {
        let runningTotal = 0;
        let runningNet = 0;
        const cData: any[] = [{ value: 0, label: chartXAxisMode === 'sessions' ? 'S0' : chartXAxisMode === 'hours' ? '0h' : '0' }];
        const nData: any[] = [{ value: 0 }];
        let cumulativeHours = 0;

        sessions.forEach((s, i) => {
            runningTotal += s.profit;
            runningNet += s.profit - (s.tips || 0) - (s.expenses || 0);
            cumulativeHours += s.durationHours;

            let label: string;
            if (chartXAxisMode === 'sessions') label = `S${i + 1}`;
            else if (chartXAxisMode === 'hours') label = `${cumulativeHours.toFixed(0)}h`;
            else label = `${Math.round(cumulativeHours * 25)}`;

            cData.push({ value: runningTotal, label });
            nData.push({ value: runningNet });
        });

        return { chartData: cData, netChartData: nData };
    }, [sessions, chartXAxisMode]);

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
                {loading ? <DashboardSkeleton /> : <>
                    {/* Page Title */}
                    <Text style={styles.pageTitle}>Performance</Text>

                    {/* Chart — hidden in privacy mode */}
                    {!privacyMode && (
                        <BankrollChart
                            data={chartData}
                            netData={netChartData}
                            xAxisMode={chartXAxisMode}
                            onToggleXAxis={toggleChartXAxis}
                        />
                    )}

                    {/* Stats Row 1: Profit | $/hr | Winrate */}
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.statsRowInner}>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Total Profit</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : (stats.totalProfit >= 0 ? COLORS.chartGold : COLORS.danger) }]}>
                                    {fmtVal(stats.totalProfit)}
                                </Text>
                                <Text style={[styles.statSub, { color: privacyMode ? COLORS.muted : (stats.netProfit >= 0 ? COLORS.accent : COLORS.danger) }]}>
                                    Net {fmtVal(stats.netProfit)}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>$/Hour</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : (stats.hourlyRate >= 0 ? COLORS.chartGold : COLORS.danger) }]}>
                                    {fmtVal(stats.hourlyRate, '$', 1)}
                                </Text>
                                <Text style={[styles.statSub, { color: privacyMode ? COLORS.muted : (stats.netHourlyRate >= 0 ? COLORS.accent : COLORS.danger) }]}>
                                    Net {fmtVal(stats.netHourlyRate, '$', 1)}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Winrate</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : (stats.winrateBB100 >= 0 ? COLORS.chartGold : COLORS.danger) }]}>
                                    {fmtBB(stats.winrateBB100)}
                                </Text>
                                <Text style={[styles.statSub, { color: privacyMode ? COLORS.muted : (stats.netWinrateBB100 >= 0 ? COLORS.accent : COLORS.danger) }]}>
                                    Net {fmtBB(stats.netWinrateBB100)}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Stats Row 2: Sessions | Hours | Win % */}
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.statsRowInner}>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Sessions</Text>
                                <Text style={styles.statValue}>
                                    {privacyMode ? '••••' : stats.sessionsPlayed}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Hours</Text>
                                <Text style={styles.statValue}>
                                    {privacyMode ? '••••' : stats.totalHours.toFixed(1)}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Win %</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : (stats.winRate >= 50 ? COLORS.accent : COLORS.danger) }]}>
                                    {privacyMode ? '••••' : `${stats.winRate.toFixed(0)}%`}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>

                    {/* Stats Row 3: Avg Length | Tips | Expenses */}
                    <GlassCard style={styles.statsCard}>
                        <View style={styles.statsRowInner}>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Avg Length</Text>
                                <Text style={styles.statValue}>
                                    {privacyMode ? '••••' : `${stats.avgSessionLength.toFixed(1)}h`}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Tips</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : COLORS.danger }]}>
                                    {fmtVal(stats.tips)}
                                </Text>
                            </View>
                            <View style={styles.statCol}>
                                <Text style={styles.statLabel}>Expenses</Text>
                                <Text style={[styles.statValue, { color: privacyMode ? COLORS.muted : COLORS.danger }]}>
                                    {fmtVal(stats.expenses)}
                                </Text>
                            </View>
                        </View>
                    </GlassCard>
                </>}
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
    pageTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 12,
    },
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
