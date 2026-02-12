import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../../model';
import Session from '../../../model/Session';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useToast } from '../../../components/ui/ToastProvider';
// Note: You might need to install @react-native-community/datetimepicker if not already
// Assuming standard text inputs for simpler implementation for now if picker is missing

export default function NewSession() {
    const router = useRouter();
    const { showToast } = useToast();
    const [gameType, setGameType] = useState('Holdem Cash');
    const [stakes, setStakes] = useState('1/2');
    const [smallBlind, setSmallBlind] = useState('1');
    const [bigBlind, setBigBlind] = useState('2');
    const [buyIn, setBuyIn] = useState('');
    const [location, setLocation] = useState('');
    const [notes, setNotes] = useState('');

    // Simplified time handling for MVP
    const [startTime, setStartTime] = useState(new Date());

    const handleSave = async () => {
        if (!buyIn) {
            showToast('Please enter buy-in amount', 'error');
            return;
        }

        try {
            await database.write(async () => {
                await database.collections.get('sessions').create((session: any) => {
                    session.gameType = gameType;
                    session.stakes = stakes;
                    session.smallBlind = parseFloat(smallBlind) || 0;
                    session.bigBlind = parseFloat(bigBlind) || 0;
                    session.buyIn = parseFloat(buyIn) || 0;
                    session.cashOut = 0; // Active session
                    session.location = location;
                    session.notes = notes;
                    session.startTime = startTime;
                    // endTime is null for active
                });
            });
            router.back();
        } catch (e) {
            console.error(e);
            showToast('Failed to create session', 'error');
        }
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.formGroup}>
                <Text style={styles.label}>Game Type</Text>
                <TextInput style={styles.input} value={gameType} onChangeText={setGameType} />
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>Stakes</Text>
                    <TextInput style={styles.input} value={stakes} onChangeText={setStakes} />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Buy-in ($)</Text>
                    <TextInput
                        style={styles.input}
                        value={buyIn}
                        onChangeText={setBuyIn}
                        keyboardType="numeric"
                        placeholder="0.00"
                        placeholderTextColor="#666"
                    />
                </View>
            </View>

            <View style={styles.row}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={styles.label}>SB</Text>
                    <TextInput style={styles.input} value={smallBlind} onChangeText={setSmallBlind} keyboardType="numeric" />
                </View>
                <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>BB</Text>
                    <TextInput style={styles.input} value={bigBlind} onChangeText={setBigBlind} keyboardType="numeric" />
                </View>
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Location</Text>
                <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="Casino / Review" placeholderTextColor="#666" />
            </View>

            <View style={styles.formGroup}>
                <Text style={styles.label}>Notes</Text>
                <TextInput
                    style={[styles.input, { height: 100 }]}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    textAlignVertical="top"
                />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Start Session</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        color: '#ccc',
        marginBottom: 8,
        fontSize: 16,
    },
    input: {
        backgroundColor: '#16213e',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#333',
    },
    row: {
        flexDirection: 'row',
    },
    saveButton: {
        backgroundColor: '#e94560',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 40,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    }
});
