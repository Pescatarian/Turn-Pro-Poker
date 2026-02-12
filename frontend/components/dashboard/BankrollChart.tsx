import React from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { LineChart, yAxisSides } from 'react-native-gifted-charts';
import { COLORS, FONTS } from '../../constants/theme';
import { GlassCard } from '../ui/GlassCard';

export type ChartXAxisMode = 'sessions' | 'hours' | 'hands';

interface ChartPoint {
    value: number;
    label?: string;
    dataPointText?: string;
}

interface BankrollChartProps {
    data: ChartPoint[];
    netData?: ChartPoint[];
    xAxisMode?: ChartXAxisMode;
    onToggleXAxis?: () => void;
}

const TOGGLE_LABELS: Record<ChartXAxisMode, string> = {
    sessions: 'S',
    hours: '⏱️',
    hands: 'H',
};

export const BankrollChart: React.FC<BankrollChartProps> = ({ data, netData, xAxisMode = 'sessions', onToggleXAxis }) => {
    const screenWidth = Dimensions.get('window').width;
    const CHART_HEIGHT = 155;
    const Y_LABEL_WIDTH = 45;
    const CHART_WIDTH = screenWidth - 80 - Y_LABEL_WIDTH;

    if (!data || data.length === 0) {
        return (
            <GlassCard style={styles.container} intensity={20}>
                <Text style={styles.noData}>No chart data available</Text>
            </GlassCard>
        );
    }

    // Calculate min/max for proper scaling
    const allValues = [...data.map(d => d.value), ...(netData?.map(d => d.value) || [])];
    const rawMin = Math.min(...allValues);
    const rawMax = Math.max(...allValues);

    // Compute nice rounded step for y-axis
    const rawRange = rawMax - rawMin || 1;
    const roughStep = rawRange / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const niceStep = Math.ceil(roughStep / magnitude) * magnitude;

    // For negative values, use yAxisOffset to shift the baseline
    const yAxisOffset = rawMin < 0 ? Math.ceil(Math.abs(rawMin) / niceStep) * niceStep : 0;

    // Shift data so all values are >= 0 for the chart library
    const shiftedData = data.map(d => ({ ...d, value: d.value + yAxisOffset }));
    const shiftedNetData = netData?.map(d => ({ ...d, value: d.value + yAxisOffset }));

    // Max value after shift, rounded up to a nice number
    const shiftedMax = rawMax + yAxisOffset;
    const maxValue = Math.ceil(shiftedMax / niceStep) * niceStep;

    // Custom y-axis label formatter to show real values (subtract offset)
    const formatYLabel = (val: string) => {
        const num = Number(val) - yAxisOffset;
        if (Math.abs(num) >= 1000) return `${(num / 1000).toFixed(1)}k`;
        return `${num}`;
    };

    return (
        <GlassCard style={styles.container} intensity={20}>
            {/* Chart container */}
            <View style={styles.chartWrapper}>
                <LineChart
                    data={shiftedData}
                    data2={shiftedNetData}
                    height={CHART_HEIGHT}
                    width={CHART_WIDTH}
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
                    initialSpacing={5}
                    endSpacing={5}
                    spacing={(CHART_WIDTH - 20) / Math.max(data.length - 1, 1)}
                    yAxisColor="transparent"
                    xAxisColor={COLORS.glassBorder}
                    yAxisTextStyle={{ color: COLORS.muted, fontSize: 9 }}
                    xAxisLabelTextStyle={{ color: COLORS.muted, fontSize: 9 }}
                    rulesColor="rgba(255,255,255,0.03)"
                    hideRules={false}
                    noOfSections={5}
                    maxValue={maxValue}
                    yAxisSide={yAxisSides.RIGHT}
                    yAxisLabelWidth={Y_LABEL_WIDTH}
                    hideYAxisText={false}
                    formatYLabel={formatYLabel}
                    showReferenceLine1={yAxisOffset > 0}
                    referenceLine1Position={yAxisOffset}
                    referenceLine1Config={{
                        color: 'rgba(255,255,255,0.25)',
                        dashWidth: 4,
                        dashGap: 4,
                        thickness: 1,
                    }}
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
                            const realVal = (items[0]?.value ?? 0) - yAxisOffset;
                            const realNet = items[1] ? (items[1]?.value ?? 0) - yAxisOffset : null;
                            return (
                                <View style={styles.tooltipContainer}>
                                    <View style={styles.tooltip}>
                                        <Text style={styles.tooltipValue}>
                                            ${realVal.toFixed(0)}
                                        </Text>
                                        {realNet !== null && (
                                            <Text style={styles.tooltipNet}>
                                                Net: ${realNet.toFixed(0)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            );
                        },
                    }}
                />
            </View>

            {/* Legend + Toggle */}
            <View style={styles.legendRow}>
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
                {onToggleXAxis && (
                    <TouchableOpacity style={styles.toggleBtn} onPress={onToggleXAxis} activeOpacity={0.7}>
                        <Text style={styles.toggleText}>{TOGGLE_LABELS[xAxisMode]}</Text>
                    </TouchableOpacity>
                )}
            </View>
        </GlassCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: 6,
        padding: 12,
        paddingBottom: 16,
    },
    legendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 12,
        justifyContent: 'space-between',
    },
    toggleBtn: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(16,185,129,0.3)',
        backgroundColor: 'rgba(16,185,129,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    toggleText: {
        color: COLORS.accent,
        fontSize: 13,
        fontWeight: '600',
    },
    legend: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        justifyContent: 'center',
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
        height: 190,
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
