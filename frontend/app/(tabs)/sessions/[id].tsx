import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from '../../../model';
import Session from '../../../model/Session';
import { COLORS } from '../../../constants/theme';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { GlassCard } from '../../../components/ui/GlassCard';
import { useToast } from '../../../components/ui/ToastProvider';

export default function SessionDetailsPage() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { showToast } = useToast();
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [cashOutAmount, setCashOutAmount] = useState('');

    useEffect(() => {
        if (!id) {
            setLoading(false);
            return;
        }

        const sessionsCollection = database.collections.get('sessions');
        const subscription = sessionsCollection
            .findAndObserve(id)
            .subscribe({
                next: (s: Session) => {
                    setSession(s);
                    setLoading(false);
                },
                error: (err: Error) => {
                    console.error('Error fetching session:', err);
                    setLoading(false);
                },
            });

        return () => subscription.unsubscribe();
    }, [id]);

    const handleEndSession = async () => {
        if (!session || !cashOutAmount) return;

        try {
            await database.write(async () => {
                await session.update((s: Session) => {
                    s.cashOut = parseFloat(cashOutAmount) || 0;
                    s.endTime = new Date();
                });
            });
        } catch (e) {
            console.error(e);
            showToast('Failed to update session', 'error');
        }
    };

    if (loading) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.accent} />
                </View>
            </ScreenWrapper>
        );
    }

    if (!session) {
        return (
            <ScreenWrapper>
                <View style={styles.loadingContainer}>
                    <Text style={styles.errorText}>Session not found</Text>
                </View>
            </ScreenWrapper>
        );
    }

    const isActive = !session.endTime;

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <GlassCard style={styles.card}>
                    <Text style={styles.header}>{session.gameType} - {session.stakes}</Text>
                    <Text style={styles.subHeader}>{new Date(session.startTime ?? Date.now()).toLocaleString()}</Text>

                    <View style={styles.statRow}>
                        <Text style={styles.label}>Buy-in</Text>
                        <Text style={styles.value}>${session.buyIn}</Text>
                    </View>

                    {!isActive && (
                        <View style={styles.statRow}>
                            <Text style={styles.label}>Cash Out</Text>
                            <Text style={styles.value}>${session.cashOut}</Text>
                        </View>
                    )}

                    <View style={styles.statRow}>
                        <Text style={styles.label}>Profit</Text>
                        <Text style={[styles.value, { color: session.profit >= 0 ? COLORS.accent : COLORS.danger }]}>
                            {isActive ? '(Active)' : `$${session.profit}`}
                        </Text>
                    </View>

                    <View style={styles.statRow}>
                        <Text style={styles.label}>Duration</Text>
                        <Text style={styles.value}>{session.durationHours.toFixed(2)} hrs</Text>
                    </View>

                    {session.location && (
                        <View style={styles.statRow}>
                            <Text style={styles.label}>Location</Text>
                            <Text style={styles.value}>{session.location}</Text>
                        </View>
                    )}
                </GlassCard>

                {isActive && (
                    <GlassCard style={styles.actionCard}>
                        <Text style={styles.actionTitle}>End Session</Text>
                        <View style={styles.inputRow}>
                            <Text style={styles.prefix}>$</Text>
                            <TextInput
                                style={styles.input}
                                value={cashOutAmount}
                                onChangeText={setCashOutAmount}
                                placeholder="Cash Out Amount"
                                placeholderTextColor={COLORS.muted}
                                keyboardType="numeric"
                            />
                        </View>
                        <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
                            <Text style={styles.endButtonText}>Finish Session</Text>
                        </TouchableOpacity>
                    </GlassCard>
                )}
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: COLORS.muted,
        fontSize: 16,
    },
    card: {
        marginBottom: 20,
    },
    header: {
        color: COLORS.text,
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subHeader: {
        color: COLORS.muted,
        marginBottom: 20,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        color: COLORS.muted,
        fontSize: 16,
    },
    value: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionCard: {
        marginBottom: 20,
    },
    actionTitle: {
        color: COLORS.text,
        fontSize: 18,
        marginBottom: 15,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
    },
    prefix: {
        color: COLORS.text,
        fontSize: 18,
        marginRight: 5,
    },
    input: {
        flex: 1,
        color: COLORS.text,
        fontSize: 18,
        paddingVertical: 12,
    },
    endButton: {
        backgroundColor: COLORS.danger,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
