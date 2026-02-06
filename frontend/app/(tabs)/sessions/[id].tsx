import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { database } from '../../../model';
import Session from '../../../model/Session';
import { withObservables } from '@nozbe/watermelondb/react';

const SessionDetails = ({ session }: { session: Session }) => {
    const router = useRouter();
    const [cashOutAmount, setCashOutAmount] = useState('');
    const [isEnding, setIsEnding] = useState(false);

    if (!session) return <View style={styles.container}><Text>Loading...</Text></View>;

    const handleEndSession = async () => {
        if (!cashOutAmount) return; // simple validation

        try {
            await database.write(async () => {
                await session.update((s: Session) => {
                    s.cashOut = parseFloat(cashOutAmount) || 0;
                    s.endTime = new Date();
                });
            });
            setIsEnding(false);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to update session');
        }
    };

    const isActive = !session.endTime;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <Text style={styles.header}>{session.gameType} - {session.stakes}</Text>
                <Text style={styles.subHeader}>{new Date(session.startTime).toLocaleString()}</Text>

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
                    <Text style={styles.label}>Running Profit</Text>
                    <Text style={[styles.value, { color: session.profit >= 0 ? '#4caf50' : '#ff5252' }]}>
                        {isActive ? '(Active)' : `$${session.profit}`}
                    </Text>
                </View>

                <View style={styles.statRow}>
                    <Text style={styles.label}>Time</Text>
                    <Text style={styles.value}>{session.durationHours.toFixed(2)} hrs</Text>
                </View>
            </View>

            {isActive && (
                <View style={styles.actionCard}>
                    <Text style={styles.actionTitle}>End Session</Text>
                    <View style={styles.inputRow}>
                        <Text style={styles.prefix}>$</Text>
                        <TextInput
                            style={styles.input}
                            value={cashOutAmount}
                            onChangeText={setCashOutAmount}
                            placeholder="Cash Out Amount"
                            placeholderTextColor="#666"
                            keyboardType="numeric"
                        />
                    </View>
                    <TouchableOpacity style={styles.endButton} onPress={handleEndSession}>
                        <Text style={styles.endButtonText}>Finish Session</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Placeholder for Add Hand Button if we want to log hands */}
        </View>
    );
};

const enhance = withObservables(['id'], ({ id }: { id: string }) => ({
    session: database.collections.get('sessions').findAndObserve(id),
}));

export default enhance(SessionDetails);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    card: {
        backgroundColor: '#16213e',
        padding: 20,
        borderRadius: 12,
        marginBottom: 20,
    },
    header: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    subHeader: {
        color: '#888',
        marginBottom: 20,
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    label: {
        color: '#ccc',
        fontSize: 16,
    },
    value: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionCard: {
        backgroundColor: '#16213e',
        padding: 20,
        borderRadius: 12,
    },
    actionTitle: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 15,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0f172a',
        borderRadius: 8,
        paddingHorizontal: 15,
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    prefix: {
        color: '#fff',
        fontSize: 18,
        marginRight: 5,
    },
    input: {
        flex: 1,
        color: '#fff',
        fontSize: 18,
        paddingVertical: 12,
    },
    endButton: {
        backgroundColor: '#e94560',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    endButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
