import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
    Image,
    Dimensions,
} from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useToast } from '../components/ui/ToastProvider';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FEATURES = [
    { text: 'Basic session tracking', free: true, premium: true, pro: true },
    { text: 'Basic statistics', free: true, premium: true, pro: true },
    { text: 'Unlimited sessions', free: false, premium: true, pro: true },
    { text: 'Advanced statistics', free: false, premium: true, pro: true },
    { text: 'Hand replayer', free: false, premium: true, pro: true },
    { text: 'CSV/PDF export', free: false, premium: true, pro: true },
    { text: 'Priority support', free: false, premium: false, pro: true },
    { text: 'Early access features', free: false, premium: false, pro: true },
];

export default function Paywall() {
    const { offerings, purchasePackage, isPro, restorePurchases, subscriptionTier } = useSubscription();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { showToast } = useToast();

    useEffect(() => {
        if (isPro) {
            showToast('You have successfully subscribed!', 'success');
            router.back();
        }
    }, [isPro]);

    const handlePurchase = async (pkg: any) => {
        setLoading(true);
        try {
            await purchasePackage(pkg);
            showToast('Your subscription is now active. Enjoy premium features!', 'success');
        } catch (e: any) {
            if (!e.userCancelled) {
                showToast('Purchase failed. Please try again.', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            await restorePurchases();
            showToast('Purchases restored successfully.', 'success');
        } catch (e) {
            showToast('Failed to restore purchases.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content} bounces={false}>
            {/* ── Hero Section with Logo ── */}
            <LinearGradient
                colors={['#1a0a2e', '#120828', '#0a0a0a']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.hero}
            >
                {/* Ambient glow behind logo */}
                <View style={styles.glowOuter}>
                    <View style={styles.glowInner} />
                </View>

                <Image
                    source={require('../assets/images/turn-pro-logo-transparent.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />

                <Text style={styles.tagline}>Elevate Your Game</Text>

                {/* Decorative divider */}
                <LinearGradient
                    colors={['transparent', 'rgba(255,215,0,0.4)', 'transparent']}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={styles.divider}
                />
            </LinearGradient>

            {/* ── Features Comparison ── */}
            <View style={styles.featuresOuter}>
                <LinearGradient
                    colors={['#141418', '#111114', '#0e0e10']}
                    style={styles.featuresCard}
                >
                    <Text style={styles.sectionTitle}>Compare Plans</Text>

                    {/* Tier Header Row */}
                    <View style={styles.tierHeader}>
                        <View style={styles.featureNameCol} />
                        <View style={styles.tierCol}>
                            <Text style={styles.tierLabelFree}>Free</Text>
                        </View>
                        <View style={styles.tierCol}>
                            <LinearGradient
                                colors={['rgba(16,185,129,0.15)', 'rgba(16,185,129,0.05)']}
                                style={styles.tierBadge}
                            >
                                <Text style={styles.tierLabelPremium}>Semi-Pro</Text>
                            </LinearGradient>
                        </View>
                        <View style={styles.tierCol}>
                            <LinearGradient
                                colors={['rgba(255,215,0,0.2)', 'rgba(255,215,0,0.05)']}
                                style={styles.tierBadge}
                            >
                                <Text style={styles.tierLabelPro}>Pro</Text>
                            </LinearGradient>
                        </View>
                    </View>

                    {/* Feature Rows */}
                    {FEATURES.map((feature, index) => (
                        <View
                            key={index}
                            style={[
                                styles.featureRow,
                                index === FEATURES.length - 1 && styles.featureRowLast,
                            ]}
                        >
                            <Text style={styles.featureText}>{feature.text}</Text>
                            <View style={styles.tierIndicators}>
                                <View style={styles.tierCol}>
                                    {feature.free ? (
                                        <View style={styles.checkCircleFree}>
                                            <Text style={styles.checkFree}>✓</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.cross}>—</Text>
                                    )}
                                </View>
                                <View style={styles.tierCol}>
                                    {feature.premium ? (
                                        <View style={styles.checkCirclePremium}>
                                            <Text style={styles.checkPremium}>✓</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.cross}>—</Text>
                                    )}
                                </View>
                                <View style={styles.tierCol}>
                                    {feature.pro ? (
                                        <View style={styles.checkCirclePro}>
                                            <Text style={styles.checkPro}>✓</Text>
                                        </View>
                                    ) : (
                                        <Text style={styles.cross}>—</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </LinearGradient>
            </View>

            {/* ── Subscription Packages ── */}
            {offerings && offerings.availablePackages && offerings.availablePackages.length > 0 && (
                <View style={styles.packagesSection}>
                    <Text style={styles.sectionTitle}>Choose Your Plan</Text>
                    {offerings.availablePackages.map((pkg: any) => {
                        const isSemiPro = pkg.identifier.toLowerCase().includes('semipro');
                        const isProPkg = pkg.identifier.toLowerCase().includes('pro') && !isSemiPro;
                        const borderColors = isProPkg
                            ? ['#FFD700', '#B8860B'] as const
                            : ['#10b981', '#08a76a'] as const;

                        return (
                            <View key={pkg.identifier} style={styles.packageWrapper}>
                                {/* Gradient border effect */}
                                <LinearGradient
                                    colors={borderColors}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                    style={styles.packageBorder}
                                >
                                    <View style={styles.packageInner}>
                                        {isProPkg && (
                                            <LinearGradient
                                                colors={['#FFD700', '#FFA500']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.bestValueBadge}
                                            >
                                                <Text style={styles.bestValueText}>★ BEST VALUE</Text>
                                            </LinearGradient>
                                        )}

                                        <View style={styles.packageContent}>
                                            <View style={styles.packageInfo}>
                                                <Text style={[
                                                    styles.pkgTitle,
                                                    isProPkg && styles.pkgTitlePro,
                                                ]}>
                                                    {pkg.product.title}
                                                </Text>
                                                <Text style={styles.pkgDesc}>
                                                    {pkg.product.description}
                                                </Text>
                                            </View>
                                            <View style={styles.priceBlock}>
                                                <Text style={[
                                                    styles.pkgPrice,
                                                    isProPkg && styles.pkgPricePro,
                                                ]}>
                                                    {pkg.product.priceString}
                                                </Text>
                                                <Text style={styles.pkgPeriod}>/month</Text>
                                            </View>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() => handlePurchase(pkg)}
                                            disabled={loading}
                                            activeOpacity={0.8}
                                        >
                                            <LinearGradient
                                                colors={isProPkg ? ['#FFD700', '#B8860B'] : ['#10b981', '#08a76a']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 0 }}
                                                style={styles.subscribeButton}
                                            >
                                                {loading ? (
                                                    <ActivityIndicator color="#fff" size="small" />
                                                ) : (
                                                    <Text style={styles.subscribeText}>
                                                        {isProPkg ? '⭐ Subscribe' : 'Subscribe'}
                                                    </Text>
                                                )}
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </View>
                                </LinearGradient>
                            </View>
                        );
                    })}
                </View>
            )}

            {/* ── Bottom Section ── */}
            <View style={styles.bottomSection}>
                <TouchableOpacity onPress={handleRestore} disabled={loading} style={styles.restoreButton}>
                    <Text style={styles.restoreText}>Restore Purchases</Text>
                </TouchableOpacity>

                <Text style={styles.disclaimer}>
                    Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
                </Text>

                <TouchableOpacity onPress={() => router.back()} style={styles.laterButton}>
                    <Text style={styles.laterText}>Maybe Later</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    content: {
        paddingBottom: 50,
    },

    // ── Hero ──
    hero: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: Platform.OS === 'ios' ? 70 : 50,
        paddingBottom: 30,
        paddingHorizontal: 30,
        position: 'relative',
        overflow: 'hidden',
    },
    glowOuter: {
        position: 'absolute',
        top: '30%',
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: 'rgba(138, 43, 226, 0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    glowInner: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: 'rgba(138, 43, 226, 0.12)',
    },
    logoImage: {
        width: SCREEN_WIDTH * 0.75,
        height: 100,
        zIndex: 1,
    },
    tagline: {
        fontSize: 16,
        color: '#9aa3a8',
        letterSpacing: 3,
        textTransform: 'uppercase',
        marginTop: 12,
        fontWeight: '300',
    },
    divider: {
        width: '60%',
        height: 1,
        marginTop: 24,
    },

    // ── Features ──
    featuresOuter: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    featuresCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#fff',
        marginBottom: 16,
    },
    tierHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        marginBottom: 4,
    },
    featureNameCol: {
        flex: 1.6,
    },
    tierCol: {
        flex: 1,
        alignItems: 'center',
    },
    tierBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    tierLabelFree: {
        color: '#666',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    tierLabelPremium: {
        color: '#10b981',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    tierLabelPro: {
        color: '#FFD700',
        fontSize: 12,
        fontWeight: '700',
        textAlign: 'center',
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    featureRowLast: {
        borderBottomWidth: 0,
    },
    featureText: {
        flex: 1.6,
        color: '#ccc',
        fontSize: 14,
    },
    tierIndicators: {
        flex: 3,
        flexDirection: 'row',
    },
    checkCircleFree: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(136,136,136,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkFree: {
        color: '#888',
        fontSize: 13,
        fontWeight: '700',
    },
    checkCirclePremium: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(16,185,129,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkPremium: {
        color: '#10b981',
        fontSize: 13,
        fontWeight: '700',
    },
    checkCirclePro: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: 'rgba(255,215,0,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkPro: {
        color: '#FFD700',
        fontSize: 13,
        fontWeight: '700',
    },
    cross: {
        color: '#333',
        fontSize: 14,
    },

    // ── Packages ──
    packagesSection: {
        paddingHorizontal: 16,
        marginTop: 28,
    },
    packageWrapper: {
        marginBottom: 16,
    },
    packageBorder: {
        borderRadius: 16,
        padding: 2, // The gradient border width
    },
    packageInner: {
        backgroundColor: '#111114',
        borderRadius: 14,
        padding: 20,
        position: 'relative',
        overflow: 'hidden',
    },
    bestValueBadge: {
        position: 'absolute',
        top: 0,
        right: 0,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderBottomLeftRadius: 12,
        borderTopRightRadius: 12,
    },
    bestValueText: {
        color: '#000',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    packageContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    packageInfo: {
        flex: 1,
        paddingRight: 12,
    },
    pkgTitle: {
        color: '#fff',
        fontSize: 19,
        fontWeight: '700',
        marginBottom: 4,
    },
    pkgTitlePro: {
        color: '#FFD700',
    },
    pkgDesc: {
        color: '#777',
        fontSize: 13,
        lineHeight: 18,
    },
    priceBlock: {
        alignItems: 'flex-end',
    },
    pkgPrice: {
        color: '#10b981',
        fontSize: 28,
        fontWeight: '800',
    },
    pkgPricePro: {
        color: '#FFD700',
    },
    pkgPeriod: {
        color: '#666',
        fontSize: 12,
        marginTop: 2,
    },
    subscribeButton: {
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subscribeText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // ── Bottom ──
    bottomSection: {
        alignItems: 'center',
        paddingHorizontal: 30,
        marginTop: 20,
    },
    restoreButton: {
        paddingVertical: 12,
    },
    restoreText: {
        color: '#10b981',
        fontSize: 15,
        textDecorationLine: 'underline',
    },
    disclaimer: {
        color: '#555',
        fontSize: 11,
        textAlign: 'center',
        lineHeight: 16,
        marginTop: 12,
    },
    laterButton: {
        marginTop: 16,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    laterText: {
        color: '#888',
        fontSize: 15,
    },
});
