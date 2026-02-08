import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { COLORS, FONTS } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

interface ChartPoint {
    value: number;
    label?: string;
    dataPointText?: string;
}

interface BankrollChartProps {
    data: ChartPoint[];
    netData?: ChartPoint[];
}

export const BankrollChart: React.FC<BankrollChartProps> = ({ data, netData }) => {
    const screenWidth = Dimensions.get('window').width;
    const CHART_HEIGHT = 180;

    if (!data || data.length === 0) {
        return (
            <GlassCard style={styles.container} intensity={20}>
                <Text style={styles.noData}>No chart data available</Text>
            </GlassCard>
        );
    }

    // Calculate min/max for proper scaling
    const allValues = [...data.map(d => d.value), ...(netData?.map(d => d.value) || [])];
    const minVal = Math.min(...allValues);
    const maxVal = Math.max(...allValues);
    const range = maxVal - minVal || 1;
    const padding = range * 0.1; // 10% padding

    return (
        <GlassCard style={styles.container} intensity={20}>
            <View style={styles.header}>
                <Text style={styles.title}>Performance</Text>
                <View style={styles.legend}>
                    <View style={[styles.dot, { backgroundColor: COLORS.chartGold }]} />
                    <Text style={styles.legendText}>Won</Text>
                    {netData && (
                        <>
                            <View style={[styles.dot, { backgroundColor: COLORS.chartGreen, marginLeft: 10 }]} />
                            <Text style={styles.legendText}>Net Profit (after tips & expenses)</Text>
                        </>
                    )}
                </View>
            </View>

            {/* Fixed height chart container to prevent stretching */}
            <View style={styles.chartWrapper}>
                <LineChart
                    data={data}
                    data2={netData}
                    height={CHART_HEIGHT}
                    width={screenWidth - 80}
                    thickness={2}
                    color={COLORS.chartGold}
                    color2={COLORS.chartGreen}
                    dataPointsColor={COLORS.chartGold}
                    dataPointsColor2={COLORS.chartGreen}
                    startFillColor={COLORS.chartGold}
                    startFillColor2={COLORS.chartGreen}
                    endFillColor={COLORS.chartGold}
                    endFillColor2={COLORS.chartGreen}
                    startOpacity={0.15}
                    endOpacity={0.0}
                    initialSpacing={10}
                    spacing={(screenWidth - 100) / Math.max(data.length - 1, 1)}
                    yAxisColor="transparent"
                    xAxisColor={COLORS.glassBorder}
                    yAxisTextStyle={{ color: COLORS.muted, fontSize: 9 }}
                    xAxisLabelTextStyle={{ color: COLORS.muted, fontSize: 9 }}
                    rulesColor="rgba(255,255,255,0.03)"
                    hideRules={false}
                    noOfSections={5}
                    maxValue={maxVal + padding}
                    mostNegativeValue={minVal - padding}
                    yAxisLabelWidth={35}
                    curved
                    curvature={0.2}
                    pointerConfig={{
                        pointerStripHeight: CHART_HEIGHT,
                        pointerStripColor: COLORS.glassBorder,
                        pointerStripWidth: 1,
                        pointerColor: COLORS.accent,
                        radius: 5,
                        pointerLabelWidth: 100,
                        pointerLabelHeight: 70,
                        activatePointersOnLongPress: false,
                        autoAdjustPointerLabelPosition: true,
                        pointerLabelComponent: (items: any) => {
                            return (
                                <View style={styles.tooltipContainer}>
                                    <View style={styles.tooltip}>
                                        <Text style={styles.tooltipValue}>
                                            ${items[0]?.value?.toFixed(0) || 0}
                                        </Text>
                                        {items[1] && (
                                            <Text style={styles.tooltipNet}>
                                                Net: ${items[1]?.value?.toFixed(0) || 0}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        },
                    }}
                />
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 16,
        padding: 16,
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    title: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: 'bold',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        flex: 1,
        justifyContent: 'flex-end',
    },
    dot: {
        width: 16,
        height: 2,
        borderRadius: 1,
        marginRight: 4,
    },
    legendText: {
        color: COLORS.muted,
        fontSize: 10,
    },
    noData: {
        color: COLORS.muted,
        textAlign: 'center',
        padding: 20,
    },
    chartWrapper: {
        height: 220,
        overflow: 'hidden',
    },
    tooltipContainer: {
        height: 70,
        width: 100,
        justifyContent: 'center',
        marginTop: -20,
        marginLeft: -40,
    },
    tooltip: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    tooltipValue: {
        color: COLORS.text,
        fontSize: 12,
        fontWeight: 'bold',
    },
    tooltipNet: {
        color: COLORS.chartGreen,
        fontSize: 11,
    },
});
