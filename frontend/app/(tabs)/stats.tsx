import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Dimensions } from 'react-native';
import { withObservables } from '@nozbe/watermelondb/react';
import { LineChart } from 'react-native-gifted-charts';
import { database } from '../../model';
import Session from '../../model/Session';
import { Q } from '@nozbe/watermelondb';

const screenWidth = Dimensions.get('window').width;

const StatsScreen = ({ sessions }: { sessions: Session[] }) => {
    const [privacyMode, setPrivacyMode] = useState(false);

    const stats = useMemo(() => {
        let totalProfit = 0;
        let totalHours = 0;
        const chartData = [];
        let runningProfit = 0;

        // Sort sessions by date just in case, though query should handle it
        const sortedSessions = [...sessions].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

        for (const session of sortedSessions) {
            totalProfit += session.profit;
            totalHours += session.durationHours;
            runningProfit += session.profit;

            chartData.push({
                value: runningProfit,
                label: new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                dataPointText: privacyMode ? '***' : `$${runningProfit.toFixed(0)}`,
            });
        }

        return {
            totalProfit,
            totalHours,
            hourlyRate: totalHours > 0 ? totalProfit / totalHours : 0,
            chartData: chartData.length > 0 ? chartData : [{ value: 0, label: 'Start' }],
        };
    }, [sessions, privacyMode]);

    const formatCurrency = (value: number) => {
        if (privacyMode) return '****';
        return `$${value.toFixed(2)}`;
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Performance</Text>
                <View style={styles.privacyContainer}>
                    <Text style={styles.privacyLabel}>Privacy Mode</Text>
                    <Switch
                        value={privacyMode}
                        onValueChange={setPrivacyMode}
                        trackColor={{ false: '#767577', true: '#e94560' }}
                        thumbColor={privacyMode ? '#fff' : '#f4f3f4'}
                    />
                </View>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Profit</Text>
                <Text style={[styles.profitValue, { color: stats.totalProfit >= 0 ? '#4caf50' : '#ff5252' }]}>
                    {formatCurrency(stats.totalProfit)}
                </Text>
            </View>

            <View style={styles.row}>
                <View style={[styles.card, styles.halfCard]}>
                    <Text style={styles.cardTitle}>Hourly Rate</Text>
                    <Text style={styles.statValue}>{formatCurrency(stats.hourlyRate)}/hr</Text>
                </View>
                <View style={[styles.card, styles.halfCard]}>
                    <Text style={styles.cardTitle}>Total Hours</Text>
                    <Text style={styles.statValue}>{stats.totalHours.toFixed(1)} hrs</Text>
                </View>
            </View>

            <View style={styles.chartContainer}>
                <Text style={styles.chartTitle}>Bankroll Trend</Text>
                <LineChart
                    data={stats.chartData}
                    height={220}
                    width={screenWidth - 40}
                    initialSpacing={10}
                    color="#e94560"
                    thickness={3}
                    startFillColor="rgba(233, 69, 96, 0.3)"
                    endFillColor="rgba(233, 69, 96, 0.01)"
                    startOpacity={0.9}
                    endOpacity={0.2}
                    areaChart
                    yAxisTextStyle={{ color: '#ccc' }}
                    xAxisLabelTextStyle={{ color: '#ccc', fontSize: 10 }}
                    hideDataPoints={false}
                    dataPointsColor="#e94560"
                    textColor="#fff"
                    textFontSize={10}
                    hideRules
                    yAxisColor="transparent"
                    xAxisColor="#333"
                />
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 15,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
    },
    privacyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    privacyLabel: {
        color: '#ccc',
        marginRight: 10,
    },
    card: {
        backgroundColor: '#16213e',
        padding: 20,
        borderRadius: 12,
        marginBottom: 15,
        alignItems: 'center',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    halfCard: {
        width: '48%',
    },
    cardTitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5,
    },
    profitValue: {
        fontSize: 36,
        fontWeight: 'bold',
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    chartContainer: {
        backgroundColor: '#16213e',
        padding: 15,
        borderRadius: 12,
        marginBottom: 30, // Extra space at bottom
        alignItems: 'center',
    },
    chartTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        alignSelf: 'flex-start',
    },
});

const enhance = withObservables([], () => ({
    sessions: database.collections.get('sessions').query(Q.sortBy('start_time', Q.asc)),
}));

export default enhance(StatsScreen);
