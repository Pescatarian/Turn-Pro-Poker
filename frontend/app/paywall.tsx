import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useRouter } from 'expo-router';

export default function Paywall() {
    const { offerings, purchasePackage, isPro, restorePurchases } = useSubscription();
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isPro) {
            Alert.alert('Success', 'You have successfully subscribed!');
            router.back();
        }
    }, [isPro]);

    const handlePurchase = async (pkg: any) => {
        setLoading(true);
        try {
            await purchasePackage(pkg);
        } catch (e: any) {
            if (!e.userCancelled) {
                Alert.alert('Error', 'Purchase failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);
        try {
            await restorePurchases();
            Alert.alert('Restore', 'Purchases restored successfully.');
        } catch (e) {
            Alert.alert('Error', 'Failed to restore purchases.');
        } finally {
            setLoading(false);
        }
    };

    if (!offerings) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#e94560" />
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Turn Pro Poker Premium</Text>
            <Text style={styles.benefit}>✓ Unlimited Session Tracking</Text>
            <Text style={styles.benefit}>✓ Advanced Statistics</Text>
            <Text style={styles.benefit}>✓ Cloud Sync & Backup</Text>
            <Text style={styles.benefit}>✓ Support Indie Development</Text>

            <View style={styles.packages}>
                {offerings.availablePackages.map((pkg: any) => (
                    <TouchableOpacity
                        key={pkg.identifier}
                        style={styles.packageCard}
                        onPress={() => handlePurchase(pkg)}
                        disabled={loading}
                    >
                        <View>
                            <Text style={styles.pkgTitle}>{pkg.product.title}</Text>
                            <Text style={styles.pkgDesc}>{pkg.product.description}</Text>
                        </View>
                        <Text style={styles.pkgPrice}>{pkg.product.priceString}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity onPress={handleRestore} style={styles.restoreButton}>
                <Text style={styles.restoreText}>Restore Purchases</Text>
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
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 30,
        marginTop: 20,
    },
    benefit: {
        fontSize: 18,
        color: '#e0e0e0',
        marginBottom: 15,
        marginLeft: 20,
    },
    packages: {
        marginTop: 30,
    },
    packageCard: {
        backgroundColor: '#16213e',
        padding: 20,
        borderRadius: 10,
        marginBottom: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e94560',
    },
    pkgTitle: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    pkgDesc: {
        color: '#888',
        fontSize: 12,
        maxWidth: 200,
    },
    pkgPrice: {
        color: '#e94560',
        fontSize: 20,
        fontWeight: 'bold',
    },
    restoreButton: {
        marginTop: 20,
        alignItems: 'center',
        marginBottom: 40,
    },
    restoreText: {
        color: '#888',
        textDecorationLine: 'underline',
    }
});
