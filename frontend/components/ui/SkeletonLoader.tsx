import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface SkeletonBarProps {
    width?: number | string;
    height?: number;
    borderRadius?: number;
    style?: any;
}

function SkeletonBar({ width = '100%', height = 16, borderRadius = 6, style }: SkeletonBarProps) {
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    useEffect(() => {
        const loop = Animated.loop(
            Animated.timing(shimmerAnim, {
                toValue: 1,
                duration: 1200,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [shimmerAnim]);

    const translateX = shimmerAnim.interpolate({
        inputRange: [-1, 1],
        outputRange: [-SCREEN_WIDTH, SCREEN_WIDTH],
    });

    return (
        <View style={[{ width: width as any, height, borderRadius, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.04)' }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

/** Skeleton for a GlassCard-sized stat card */
export function StatCardSkeleton() {
    return (
        <View style={styles.statCard}>
            <SkeletonBar width="40%" height={10} />
            <SkeletonBar width="60%" height={24} style={{ marginTop: 8 }} />
            <SkeletonBar width="50%" height={10} style={{ marginTop: 6 }} />
        </View>
    );
}

/** Skeleton row of 2 stat cards */
export function StatRowSkeleton() {
    return (
        <View style={styles.statRow}>
            <StatCardSkeleton />
            <StatCardSkeleton />
        </View>
    );
}

/** Skeleton for a session list card */
export function SessionCardSkeleton() {
    return (
        <View style={styles.sessionCard}>
            <View style={styles.sessionRow}>
                <SkeletonBar width="30%" height={14} />
                <SkeletonBar width="20%" height={14} />
            </View>
            <SkeletonBar width="50%" height={12} style={{ marginTop: 8 }} />
            <SkeletonBar width="70%" height={12} style={{ marginTop: 6 }} />
        </View>
    );
}

/** Several skeleton session cards */
export function SessionListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <View style={{ gap: 12, paddingHorizontal: 16 }}>
            {Array.from({ length: count }).map((_, i) => (
                <SessionCardSkeleton key={i} />
            ))}
        </View>
    );
}

/** Skeleton for the chart area */
export function ChartSkeleton() {
    return (
        <View style={styles.chartArea}>
            <SkeletonBar width="100%" height={160} borderRadius={12} />
        </View>
    );
}

/** Full dashboard skeleton (hero + stats + chart) */
export function DashboardSkeleton() {
    return (
        <View style={styles.dashboardWrap}>
            {/* Hero card */}
            <View style={styles.heroCard}>
                <SkeletonBar width="35%" height={12} />
                <SkeletonBar width="55%" height={28} style={{ marginTop: 10 }} />
                <SkeletonBar width="40%" height={12} style={{ marginTop: 8 }} />
            </View>
            {/* Stat rows */}
            <StatRowSkeleton />
            <StatRowSkeleton />
            {/* Chart */}
            <ChartSkeleton />
        </View>
    );
}

const styles = StyleSheet.create({
    statCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        padding: 14,
    },
    statRow: {
        flexDirection: 'row',
        gap: 12,
        paddingHorizontal: 16,
    },
    sessionCard: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        padding: 14,
    },
    sessionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    chartArea: {
        paddingHorizontal: 16,
    },
    dashboardWrap: {
        gap: 12,
        paddingTop: 8,
    },
    heroCard: {
        marginHorizontal: 16,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        padding: 20,
    },
});
