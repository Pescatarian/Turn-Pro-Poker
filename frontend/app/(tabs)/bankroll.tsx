import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Dimensions } from 'react-native';
import { database } from '../../model';
import Session from '../../model/Session';
import Transaction from '../../model/Transaction';
import { Q } from '@nozbe/watermelondb';
import { LineChart } from 'react-native-gifted-charts';

const screenWidth = Dimensions.get('window').width;

const BankrollScreen = () => {
    const [sessions, setSessions] = useState<Session[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'deposit' | 'withdrawal'>('deposit');
    const [notes, setNotes] = useState('');

    const loadData = async () => {
        try {
            const s = await database.collections.get('sessions').query(Q.sortBy('start_time', Q.asc)).fetch() as Session[];
            const t = await database.collections.get('transactions').query(Q.sortBy('created_at', Q.asc)).fetch() as Transaction[];
            setSessions(s);
            setTransactions(t);
        } catch (error) {
            console.error('Failed to load bankroll data:', error);
        }
    };

    useEffect(() => {
        loadData();

        const sSub = database.collections.get('sessions').changes.subscribe(loadData);
        const tSub = database.collections.get('transactions').changes.subscribe(loadData);

        return () => {
            sSub.unsubscribe();
            tSub.unsubscribe();
        };
    }, []);

    const combinedData = useMemo(() => {
        const events = [
            ...sessions.map(s => ({ date: s.startTime, amount: s.profit, type: 'session', id: s.id })),
            ...transactions.map(t => ({ date: t.createdAt, amount: t.type === 'withdrawal' ? -t.amount : t.amount, type: 'transaction', id: t.id }))
        ];

        // Sort by date
        events.sort((a, b) => a.date.getTime() - b.date.getTime());

        let currentBankroll = 0;
        const chartData = [];

        events.forEach(event => {
            currentBankroll += event.amount;
            chartData.push({
                value: currentBankroll,
                label: event.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                dataPointText: `$${currentBankroll.toFixed(0)}`,
                hideDataPoint: true, // Hide points to reduce clutter if many events
            });
        });

        // Ensure at least one point to avoid chart errors
        if (chartData.length === 0) {
            chartData.push({ value: 0, label: 'Start' });
        }

        return { events: events.reverse(), currentBankroll, chartData }; // Reverse events for list view (newest first)
    }, [sessions, transactions]);

    const handleAddTransaction = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            Alert.alert('Invalid Amount', 'Please enter a valid number.');
            return;
        }

        try {
            await database.write(async () => {
                const transactionCollection = database.collections.get('transactions');
                await transactionCollection.create((record: any) => {
                    record.amount = parseFloat(amount);
                    record.type = type;
                    record.notes = notes;
                });
            });
            setModalVisible(false);
            setAmount('');
            setNotes('');
            Alert.alert('Success', 'Transaction added successfully.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to add transaction.');
        }
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.item}>
            <View>
                <Text style={styles.date}>{item.date.toLocaleDateString()}</Text>
                <Text style={styles.type}>{item.type === 'session' ? 'Poker Session' : (item.amount > 0 ? 'Deposit' : 'Withdrawal')}</Text>
            </View>
            <Text style={[styles.amount, { color: item.amount >= 0 ? '#4caf50' : '#ff5252' }]}>
                {item.amount >= 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
            </Text>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Bankroll: ${combinedData.currentBankroll.toFixed(2)}</Text>
                <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.chartContainer}>
                <LineChart
                    data={combinedData.chartData}
                    height={200}
                    width={screenWidth - 40}
                    initialSpacing={10}
                    color="#4caf50"
                    thickness={3}
                    startFillColor="rgba(76, 175, 80, 0.3)"
                    endFillColor="rgba(76, 175, 80, 0.01)"
                    startOpacity={0.9}
                    endOpacity={0.2}
                    areaChart
                    yAxisTextStyle={{ color: '#ccc' }}
                    xAxisLabelTextStyle={{ color: '#ccc', fontSize: 10 }}
                    hideDataPoints={false}
                    dataPointsColor="#4caf50"
                    textColor="#fff"
                    textFontSize={10}
                    hideRules
                    yAxisColor="transparent"
                    xAxisColor="#333"
                />
            </View>

            <Text style={styles.historyTitle}>Recent Activity</Text>
            <ScrollView contentContainerStyle={styles.list}>
                {combinedData.events.map(item => (
                    <View key={item.id} style={styles.item}>
                        <View>
                            <Text style={styles.date}>{item.date.toLocaleDateString()}</Text>
                            <Text style={styles.type}>{item.type === 'session' ? 'Poker Session' : (item.amount > 0 ? 'Deposit' : 'Withdrawal')}</Text>
                        </View>
                        <Text style={[styles.amount, { color: item.amount >= 0 ? '#4caf50' : '#ff5252' }]}>
                            {item.amount >= 0 ? '+' : ''}${Math.abs(item.amount).toFixed(2)}
                        </Text>
                    </View>
                ))}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Add Transaction</Text>

                    <View style={styles.typeSelector}>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'deposit' && styles.activeType]}
                            onPress={() => setType('deposit')}
                        >
                            <Text style={styles.typeText}>Deposit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.typeButton, type === 'withdrawal' && styles.activeType]}
                            onPress={() => setType('withdrawal')}
                        >
                            <Text style={styles.typeText}>Withdrawal</Text>
                        </TouchableOpacity>
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Amount"
                        placeholderTextColor="#888"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Notes (optional)"
                        placeholderTextColor="#888"
                        value={notes}
                        onChangeText={setNotes}
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.cancelButton]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.buttonText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.saveButton]}
                            onPress={handleAddTransaction}
                        >
                            <Text style={styles.buttonText}>Save</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
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
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    addButton: {
        backgroundColor: '#e94560',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    chartContainer: {
        backgroundColor: '#16213e',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    historyTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    list: {
        paddingBottom: 20,
    },
    item: {
        backgroundColor: '#16213e',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    date: {
        color: '#ccc',
        fontSize: 12,
    },
    type: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    amount: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalView: {
        margin: 20,
        marginTop: 100,
        backgroundColor: '#16213e',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
    },
    typeSelector: {
        flexDirection: 'row',
        marginBottom: 20,
        backgroundColor: '#0f3460',
        borderRadius: 8,
        overflow: 'hidden',
    },
    typeButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        width: 120,
        alignItems: 'center',
    },
    activeType: {
        backgroundColor: '#e94560',
    },
    typeText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    input: {
        height: 50,
        width: '100%',
        backgroundColor: '#1a1a2e',
        borderRadius: 8,
        paddingHorizontal: 15,
        color: '#fff',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#333',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginTop: 10,
    },
    button: {
        padding: 15,
        borderRadius: 8,
        width: '48%',
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#333',
    },
    saveButton: {
        backgroundColor: '#4caf50',
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});

export default BankrollScreen;
