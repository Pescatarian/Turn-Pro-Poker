import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { GlassCard } from '../components/ui/GlassCard';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function CoachScreen() {
    const router = useRouter();

    return (
        <ScreenWrapper hideHeader>
            <View style={styles.container}>
                {/* Back button */}
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Ionicons name="chevron-back" size={22} color={COLORS.text} />
                    <Text style={styles.backText}>Home</Text>
                </TouchableOpacity>

                <Text style={styles.title}>Get Coach</Text>
                <Text style={styles.subtitle}>Improve your game with professional coaching</Text>

                <GlassCard style={styles.card} intensity={20}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="school-outline" size={48} color={COLORS.accent} />
                    </View>
                    <Text style={styles.cardTitle}>Coaching Coming Soon</Text>
                    <Text style={styles.cardText}>
                        Connect with professional poker coaches who can review your sessions,
                        identify leaks, and help you level up your game.
                    </Text>

                    <View style={styles.featureList}>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                            <Text style={styles.featureText}>1-on-1 session reviews</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                            <Text style={styles.featureText}>Hand analysis & strategy tips</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                            <Text style={styles.featureText}>Bankroll management advice</Text>
                        </View>
                        <View style={styles.featureRow}>
                            <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                            <Text style={styles.featureText}>Personalized study plans</Text>
                        </View>
                    </View>
                </GlassCard>

                <Text style={styles.notify}>
                    We'll notify you when coaching is available.
                </Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 20,
    },
    backText: {
        color: COLORS.text,
        fontSize: 15,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 24,
    },
    card: {
        padding: 24,
        alignItems: 'center',
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(16,185,129,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 10,
    },
    cardText: {
        fontSize: 14,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 20,
    },
    featureList: {
        alignSelf: 'stretch',
        gap: 12,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    featureText: {
        color: COLORS.text,
        fontSize: 14,
    },
    notify: {
        textAlign: 'center',
        color: COLORS.muted,
        fontSize: 12,
        marginTop: 20,
    },
});
