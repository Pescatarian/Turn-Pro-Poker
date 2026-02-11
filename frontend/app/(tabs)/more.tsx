import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { COLORS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';

export default function MoreScreen() {
    const router = useRouter();
    const [isExporting, setIsExporting] = useState(false);

    // Safe context access with fallbacks
    let user: any = null;
    let signOut: (() => Promise<void>) | undefined;
    let isPro = false;
    let hasPasscode = false;

    try {
        const auth = useAuth();
        user = auth.user;
        signOut = auth.signOut;
    } catch (e) {
        console.warn('Auth context not available:', e);
    }

    try {
        const sub = useSubscription();
        isPro = sub.isPro;
    } catch (e) {
        console.warn('Subscription context not available:', e);
    }

    try {
        const { usePasscodeLock } = require('../../contexts/PasscodeLockContext');
        const passcode = usePasscodeLock();
        hasPasscode = passcode.hasPasscode;
    } catch (e) {
        console.warn('PasscodeLock context not available:', e);
    }

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { exportSessionsCSV } = require('../../services/export');
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

    const comingSoon = (feature: string) => {
        Alert.alert(feature, 'This feature is coming soon!');
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
                            if (signOut) await signOut();
                        } catch (error) {
                            console.error(error);
                            Alert.alert('Error', 'Failed to sign out.');
                        }
                    }
                },
            ]
        );
    };

    const handleRestore = async () => {
        try {
            const { useSubscription: getSub } = require('../../contexts/SubscriptionContext');
            Alert.alert('Restore', 'Restore purchases is not available in development builds.');
        } catch (e) {
            Alert.alert('Error', 'Could not restore purchases.');
        }
    };

    type MenuItemType = {
        icon: string;
        title: string;
        subtitle: string;
        onPress: () => void;
        isLoading?: boolean;
        right?: 'chevron' | 'status';
        statusOn?: boolean;
    };

    const menuItems: MenuItemType[] = [
        { icon: 'card-outline', title: 'Transactions', subtitle: 'View bankroll transactions', onPress: () => router.push('/(tabs)/more/transactions' as any), right: 'chevron' },
        { icon: 'people-outline', title: 'Player Profiles', subtitle: 'Track opponents & friends', onPress: () => comingSoon('Player Profiles'), right: 'chevron' },
        { icon: 'location-outline', title: 'Locations', subtitle: 'Manage your poker venues', onPress: () => comingSoon('Locations'), right: 'chevron' },
        { icon: 'document-text-outline', title: 'Notepad', subtitle: 'Quick notes & observations', onPress: () => comingSoon('Notepad'), right: 'chevron' },
        { icon: 'calendar-outline', title: 'Calendar', subtitle: 'View sessions by date', onPress: () => comingSoon('Calendar'), right: 'chevron' },
        { icon: 'download-outline', title: 'CSV Export', subtitle: 'Export data to spreadsheet', onPress: handleExport, isLoading: isExporting, right: 'chevron' },
        { icon: 'document-outline', title: 'PDF Export', subtitle: 'Generate PDF reports', onPress: () => comingSoon('PDF Export'), right: 'chevron' },
    ];

    const settingsItems: MenuItemType[] = [
        { icon: 'lock-closed-outline', title: 'Passcode Lock', subtitle: 'Protect your data', onPress: () => router.push('/(tabs)/more/passcode-setup' as any), right: 'status', statusOn: hasPasscode },
        { icon: 'sync-outline', title: 'Data Sync', subtitle: 'Sync across devices', onPress: () => comingSoon('Sync'), right: 'chevron' },
        { icon: 'refresh-outline', title: 'Restore Purchases', subtitle: 'Restore previously bought subscriptions', onPress: handleRestore, right: 'chevron' },
    ];

    const renderMenuItem = (item: MenuItemType, index: number, isLast: boolean) => (
        <TouchableOpacity
            key={item.title}
            style={[styles.menuItem, !isLast && styles.menuItemBorder]}
            onPress={item.onPress}
            disabled={item.isLoading}
            activeOpacity={0.6}
        >
            <View style={styles.menuIconWrap}>
                {item.isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.accent} />
                ) : (
                    <Ionicons name={item.icon as any} size={18} color="#9aa3a8" />
                )}
            </View>
            <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            {item.right === 'status' ? (
                <Text style={[styles.statusBadge, item.statusOn ? styles.statusOn : styles.statusOff]}>
                    {item.statusOn ? 'On' : 'Off'}
                </Text>
            ) : (
                <Ionicons name="chevron-forward" size={14} color="#6b7280" />
            )}
        </TouchableOpacity>
    );

    return (
        <ScreenWrapper hideHeader>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {/* Header */}
                <Text style={styles.pageTitle}>More</Text>

                {/* Profile Card */}
                <View style={styles.profileCard}>
                    <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={22} color={COLORS.accent} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileEmail}>{user?.email || 'Not verified'}</Text>
                        <Text style={[styles.profilePlan, isPro ? styles.proText : styles.freeText]}>
                            {isPro ? '💎 PRO PLAN' : 'FREE PLAN'}
                        </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color="#6b7280" />
                </View>

                {/* Features Section */}
                <Text style={styles.sectionLabel}>Features</Text>
                <View style={styles.menuContainer}>
                    {menuItems.map((item, index) => renderMenuItem(item, index, index === menuItems.length - 1))}
                </View>

                {/* Settings Section */}
                <Text style={styles.sectionLabel}>Settings</Text>
                <View style={styles.menuContainer}>
                    {settingsItems.map((item, index) => renderMenuItem(item, index, index === settingsItems.length - 1))}
                </View>

                {/* Premium Banner */}
                {!isPro && (
                    <TouchableOpacity style={styles.premiumBanner} onPress={() => router.push('/paywall')} activeOpacity={0.7}>
                        <View>
                            <Text style={styles.premiumTitle}>💎 Upgrade to Premium</Text>
                            <Text style={styles.premiumSubtitle}>Unlock advanced stats, exports, and more</Text>
                        </View>
                        <Text style={styles.premiumArrow}>→</Text>
                    </TouchableOpacity>
                )}

                {/* Sign Out */}
                <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.6}>
                    <Ionicons name="log-out-outline" size={18} color={COLORS.danger} />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.version}>Version 1.0.0</Text>
            </ScrollView>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 30,
    },
    pageTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.text,
        marginBottom: 16,
    },

    // Profile Card
    profileCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
    },
    profileAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(16,185,129,0.1)',
        borderWidth: 2,
        borderColor: 'rgba(16,185,129,0.3)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    profileInfo: {
        flex: 1,
    },
    profileEmail: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    profilePlan: {
        fontSize: 11,
        fontWeight: '700',
        marginTop: 2,
    },
    proText: {
        color: COLORS.accent,
    },
    freeText: {
        color: COLORS.muted,
    },

    // Section Labels
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#6b7280',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 4,
    },

    // Menu Container
    menuContainer: {
        backgroundColor: 'rgba(255,255,255,0.02)',
        borderRadius: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.04)',
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
    },
    menuItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    menuIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 8,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuTextWrap: {
        flex: 1,
    },
    menuTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '600',
    },
    menuSubtitle: {
        color: '#6b7280',
        fontSize: 12,
        marginTop: 1,
    },
    statusBadge: {
        fontSize: 12,
        fontWeight: '600',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        overflow: 'hidden',
    },
    statusOn: {
        color: COLORS.accent,
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    statusOff: {
        color: COLORS.muted,
        backgroundColor: 'rgba(255,255,255,0.04)',
    },

    // Premium Banner
    premiumBanner: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'rgba(102,126,234,0.12)',
        borderWidth: 2,
        borderColor: '#FFD700',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    premiumTitle: {
        color: '#FFD700',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    premiumSubtitle: {
        color: '#ddd',
        fontSize: 13,
    },
    premiumArrow: {
        color: '#FFD700',
        fontSize: 24,
        fontWeight: 'bold',
    },

    // Sign Out
    signOutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: 'rgba(233,69,96,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(233,69,96,0.3)',
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
    },
    signOutText: {
        color: COLORS.danger,
        fontSize: 15,
        fontWeight: '600',
    },

    version: {
        textAlign: 'center',
        color: '#444',
        fontSize: 11,
        marginBottom: 10,
    },
});
