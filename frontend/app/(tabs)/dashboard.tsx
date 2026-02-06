import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../model';
import Session from '../../model/Session';
import { Q } from '@nozbe/watermelondb';

export default function Dashboard() {
    const { user } = useAuth();
    const [recentSessions, setRecentSessions] = useState<Session[]>([]);
    const [totalProfit, setTotalProfit] = useState(0);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        // Determine start of month for "This Month" stats, or just load all-time for now
        const sessions = await database.collections.get('sessions').query(
            Q.sortBy('start_time', Q.desc),
            Q.take(5)
        ).fetch();

        setRecentSessions(sessions);

        // Naive total profit calculation (should ideally be a direct query or pre-calculated stats)
        const allSessions = await database.collections.get('sessions').query().fetch() as Session[];
        const profit = allSessions.reduce((sum, s) => sum + s.profit, 0);
        setTotalProfit(profit);
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    return (
        <ScrollView
            style={styles.container}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
        >
            <View style={styles.header}>
                <Text style={styles.welcomeText}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.display_name || 'Player'}</Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.cardTitle}>Total Bankroll</Text>
                <Text style={[styles.bankrollAmount, { color: totalProfit >= 0 ? '#4caf50' : '#ff5252' }]}>
                    ${totalProfit.toFixed(2)}
                </Text>
                <Text style={styles.cardSubtitle}>All Time Profit</Text>
            </View>

            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Sessions</Text>
            </View>

            {recentSessions.length === 0 ? (
                <Text style={styles.emptyText}>No sessions played yet.</Text>
            ) : (
                recentSessions.map((session) => (
                    <View key={session.id} style={styles.sessionItem}>
                        <View>
                            <Text style={styles.sessionDate}>{new Date(session.startTime).toLocaleDateString()}</Text>
                            <Text style={styles.sessionDetails}>{session.gameType} - {session.stakes}</Text>
                        </View>
                        <Text style={[styles.sessionProfit, { color: session.profit >= 0 ? '#4caf50' : '#ff5252' }]}>
                            {session.profit >= 0 ? '+' : ''}${session.profit}
                        </Text>
                    </View>
                ))
            )}
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        padding: 20,
    },
    header: {
        marginBottom: 20,
    },
    welcomeText: {
        color: '#888',
        fontSize: 16,
    },
    userName: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    card: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 20,
        marginBottom: 30,
        alignItems: 'center',
    },
    cardTitle: {
        color: '#888',
        fontSize: 14,
        marginBottom: 5,
    },
    bankrollAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    cardSubtitle: {
        color: '#888',
        fontSize: 12,
    },
    sectionHeader: {
        marginBottom: 15,
    },
    sectionTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    sessionItem: {
        backgroundColor: '#16213e',
        borderRadius: 8,
        padding: 15,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sessionDate: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sessionDetails: {
        color: '#888',
        fontSize: 14,
    },
    sessionProfit: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#888',
        textAlign: 'center',
        marginTop: 20,
    }
});
