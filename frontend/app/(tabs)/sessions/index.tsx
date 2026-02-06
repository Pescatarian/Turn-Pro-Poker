import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../../model';
import Session from '../../../model/Session';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';

const SessionItem = ({ session }: { session: Session }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.item}
            onPress={() => router.push(`/(tabs)/sessions/${session.id}` as any)}
        >
            <View>
                <Text style={styles.date}>{new Date(session.startTime).toLocaleDateString()}</Text>
                <Text style={styles.details}>{session.gameType} - {session.stakes}</Text>
                <Text style={styles.duration}>{session.durationHours.toFixed(1)} hrs</Text>
            </View>
            <View style={styles.right}>
                <Text style={[styles.profit, { color: session.profit >= 0 ? '#4caf50' : '#ff5252' }]}>
                    {session.profit >= 0 ? '+' : ''}${session.profit}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const EnhancedSessionItem = withObservables(['session'], ({ session }: { session: Session }) => ({
    session, // observe session changes
}))(SessionItem);

const SessionsList = ({ sessions }: { sessions: Session[] }) => {
    return (
        <View style={styles.container}>
            <FlatList
                data={sessions}
                keyExtractor={item => item.id}
                renderItem={({ item }) => <EnhancedSessionItem session={item} />}
                contentContainerStyle={styles.list}
                ListEmptyComponent={<Text style={styles.empty}>No sessions found. Start playing!</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
    },
    list: {
        padding: 15,
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
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    details: {
        color: '#888',
        marginTop: 4,
    },
    duration: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    right: {
        alignItems: 'flex-end',
    },
    profit: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    empty: {
        color: '#888',
        textAlign: 'center',
        marginTop: 50,
    }
});

// Observable wrapper to auto-update list when DB changes
const enhance = withObservables([], () => ({
    sessions: database.collections.get('sessions').query(Q.sortBy('start_time', Q.desc)),
}));

export default enhance(SessionsList);
