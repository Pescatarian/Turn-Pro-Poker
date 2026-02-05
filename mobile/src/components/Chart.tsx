import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle, Text as SvgText } from 'react-native-svg';
import { colors, spacing, fontSize } from '../constants/theme';
import { Session } from '../types';
import { formatCents } from '../utils/money';

interface ChartProps {
  sessions: Session[];
  height?: number;
}

export function BankrollChart({ sessions, height = 200 }: ChartProps) {
  const width = Dimensions.get('window').width - spacing.md * 2;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  if (sessions.length < 2) {
    return (
      <View style={[styles.container, { height }]}>
        <Text style={styles.emptyText}>Add more sessions to see chart</Text>
      </View>
    );
  }

  // Calculate cumulative bankroll over time
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  let runningTotal = 0;
  const dataPoints = sortedSessions.map((session, index) => {
    const profit = session.cashoutCents - session.buyinCents;
    runningTotal += profit;
    return {
      x: index,
      y: runningTotal,
      date: session.date,
      profit,
    };
  });

  // Calculate scales
  const minY = Math.min(0, ...dataPoints.map(d => d.y));
  const maxY = Math.max(0, ...dataPoints.map(d => d.y));
  const yRange = maxY - minY || 1;

  const scaleX = (x: number) => padding.left + (x / (dataPoints.length - 1)) * chartWidth;
  const scaleY = (y: number) => padding.top + chartHeight - ((y - minY) / yRange) * chartHeight;

  // Generate path
  const pathData = dataPoints
    .map((point, i) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    })
    .join(' ');

  // Generate area path (for gradient fill)
  const areaPath = `${pathData} L ${scaleX(dataPoints.length - 1)} ${scaleY(0)} L ${scaleX(0)} ${scaleY(0)} Z`;

  // Y-axis labels
  const yLabels = [minY, (minY + maxY) / 2, maxY].map(v => Math.round(v));

  // Current value
  const currentValue = dataPoints[dataPoints.length - 1]?.y || 0;
  const isPositive = currentValue >= 0;

  return (
    <View style={[styles.container, { height }]}>
      <Svg width={width} height={height}>
        {/* Grid lines */}
        {yLabels.map((label, i) => (
          <Line
            key={i}
            x1={padding.left}
            y1={scaleY(label)}
            x2={width - padding.right}
            y2={scaleY(label)}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={1}
          />
        ))}

        {/* Zero line */}
        <Line
          x1={padding.left}
          y1={scaleY(0)}
          x2={width - padding.right}
          y2={scaleY(0)}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth={1}
          strokeDasharray="4,4"
        />

        {/* Area fill */}
        <Path
          d={areaPath}
          fill={isPositive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}
        />

        {/* Line */}
        <Path
          d={pathData}
          fill="none"
          stroke={isPositive ? colors.accent : colors.danger}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {dataPoints.map((point, i) => (
          <Circle
            key={i}
            cx={scaleX(point.x)}
            cy={scaleY(point.y)}
            r={3}
            fill={point.profit >= 0 ? colors.accent : colors.danger}
          />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((label, i) => (
          <SvgText
            key={i}
            x={padding.left - 8}
            y={scaleY(label) + 4}
            fill={colors.muted}
            fontSize={10}
            textAnchor="end"
          >
            {formatCents(label)}
          </SvgText>
        ))}

        {/* X-axis labels (first and last date) */}
        <SvgText
          x={padding.left}
          y={height - 8}
          fill={colors.muted}
          fontSize={10}
        >
          {new Date(dataPoints[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </SvgText>
        <SvgText
          x={width - padding.right}
          y={height - 8}
          fill={colors.muted}
          fontSize={10}
          textAnchor="end"
        >
          {new Date(dataPoints[dataPoints.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </SvgText>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: fontSize.sm,
  },
});