import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { usePasscodeLock } from '../../contexts/PasscodeLockContext';
import { sync } from '../../sync';
import { exportSessionsCSV } from '../../services/export';

export default function MoreScreen() {
    const { user, signOut } = useAuth();
    const { isPro, restorePurchases } = useSubscription();
    const { hasPasscode } = usePasscodeLock();
    const [isSyncing, setIsSyncing] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const router = useRouter();

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const result = await exportSessionsCSV();
            if (!result.success) {
                Alert.alert('Export', result.error || 'Export failed.');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to export data.');
        } finally {
            setIsExporting(false);
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await sync();
            Alert.alert('Success', 'Data synced successfully.');
        } catch (error) {
            console.error(error);
            Alert.alert('Error', 'Failed to sync data.');
        } finally {
            setIsSyncing(false);
        }
    };

    const handleSignOut = async () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await signOut();
                            // Router will handle redirect in AuthContext
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to sign out.');
                        }
                    }
                },
            ]
        );
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>More</Text>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Profile</Text>
                <View style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email || 'Not verified'}</Text>

                    <View style={styles.separator} />

                    <Text style={styles.label}>Subscription Status</Text>
                    <Text style={[styles.value, isPro ? styles.proText : styles.freeText]}>
                        {isPro ? 'PRO PLAN' : 'FREE PLAN'}
                    </Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Security</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/(tabs)/more/passcode-setup' as any)}
                >
                    <View style={styles.buttonRow}>
                        <Text style={styles.buttonText}>Passcode Lock</Text>
                        <Text style={[styles.statusText, hasPasscode ? styles.onText : styles.offText]}>
                            {hasPasscode ? 'On' : 'Off'}
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Premium Features</Text>
                <TouchableOpacity
                    style={[styles.button, styles.premiumButton]}
                    onPress={() => router.push('/paywall')}
                >
                    <View style={styles.premiumButtonContent}>
                        <View>
                            <Text style={styles.premiumButtonTitle}>💎 Upgrade to Premium</Text>
                            <Text style={styles.premiumButtonSubtitle}>
                                Unlock advanced stats, exports, and more
                            </Text>
                        </View>
                        <Text style={styles.premiumArrow}>→</Text>
                    </View>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Data Management</Text>

                <TouchableOpacity style={styles.button} onPress={handleSync} disabled={isSyncing}>
                    {isSyncing ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Sync Now</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleExport}
                    disabled={isExporting}
                >
                    {isExporting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Export Data (CSV)</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={restorePurchases}
                >
                    <Text style={styles.buttonText}>Restore Purchases</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Account</Text>
                <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={handleSignOut}>
                    <Text style={[styles.buttonText, styles.signOutText]}>Sign Out</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.version}>Version 1.0.0</Text>
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
        marginTop: 20,
        marginBottom: 30,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
    },
    section: {
        marginBottom: 30,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#888',
        marginBottom: 10,
        marginLeft: 4,
    },
    card: {
        backgroundColor: '#16213e',
        borderRadius: 12,
        padding: 20,
    },
    label: {
        color: '#888',
        fontSize: 14,
        marginBottom: 4,
    },
    value: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    separator: {
        height: 1,
        backgroundColor: '#333',
        marginVertical: 15,
    },
    subscriptionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    proText: {
        color: '#4caf50',
        fontWeight: 'bold',
    },
    freeText: {
        color: '#ccc',
    },
    upgradeButton: {
        backgroundColor: '#e94560',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 20,
    },
    upgradeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#16213e',
        padding: 18,
        borderRadius: 12,
        marginBottom: 10,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '500',
    },
    signOutButton: {
        backgroundColor: 'rgba(233, 69, 96, 0.1)',
        borderWidth: 1,
        borderColor: '#e94560',
    },
    signOutText: {
        color: '#e94560',
        fontWeight: 'bold',
    },
    version: {
        textAlign: 'center',
        color: '#666',
        marginBottom: 40,
        fontSize: 12,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    statusText: {
        fontSize: 14,
        fontWeight: '600',
    },
    onText: {
        color: '#4caf50',
    },
    offText: {
        color: '#888',
    },
    premiumButton: {
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderWidth: 2,
        borderColor: '#FFD700',
    },
    premiumButtonContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    premiumButtonTitle: {
        color: '#FFD700',
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    premiumButtonSubtitle: {
        color: '#ddd',
        fontSize: 13,
    },
    premiumArrow: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },
});
