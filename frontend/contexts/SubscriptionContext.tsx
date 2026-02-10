import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { purchasesService, SubscriptionTier } from '../services/purchases';
import { useAuth } from './AuthContext';

type SubscriptionContextType = {
    isPro: boolean;
    subscriptionTier: SubscriptionTier;
    restorePurchases: () => Promise<void>;
    purchasePackage: (pkg: any) => Promise<void>;
    refreshSubscription: () => Promise<void>;
    offerings: any; // Using any for simplicity now, ideally PurchasesOffering
};

const SubscriptionContext = createContext<SubscriptionContextType>({
    isPro: false,
    subscriptionTier: 'free',
    restorePurchases: async () => { },
    purchasePackage: async () => { },
    refreshSubscription: async () => { },
    offerings: null,
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('free');
    const [offerings, setOfferings] = useState<any>(null);

    useEffect(() => {
        // Skip RevenueCat on web - IAP doesn't work in browsers
        if (Platform.OS === 'web') {
            return;
        }

        // Skip RevenueCat in Expo Go (StoreClient)
        if (Constants.executionEnvironment === 'storeClient') {
            return;
        }

        if (user) {
            // Initialize purchases when user logs in
            const initPurchases = async () => {
                try {
                    // Use database ID or a stable ID for RevenueCat
                    await purchasesService.init(user.id.toString());

                    const status = await purchasesService.getSubscriptionStatus();
                    setIsPro(status.isActive && status.tier === 'pro');
                    setSubscriptionTier(status.tier);

                    const currentOfferings = await purchasesService.getOfferings();
                    setOfferings(currentOfferings);
                } catch (error) {
                    console.log('RevenueCat init failed (expected in Expo Go or dev builds):', error);
                    // Fail gracefully - set empty offerings so UI doesn't hang
                    setIsPro(false);
                    setSubscriptionTier('free');
                    setOfferings({ availablePackages: [] } as any); // Empty offerings to unblock UI
                }
            };

            initPurchases();
        } else {
            // Reset if no user
            setIsPro(false);
            setSubscriptionTier('free');
            setOfferings(null);
        }
    }, [user]);

    const refreshSubscription = async () => {
        try {
            const status = await purchasesService.getSubscriptionStatus();
            setIsPro(status.isActive && status.tier === 'pro');
            setSubscriptionTier(status.tier);
        } catch (e) {
            console.error('Failed to refresh subscription:', e);
        }
    };

    const restorePurchases = async () => {
        try {
            await purchasesService.restorePurchases();
            await refreshSubscription();
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const purchasePackage = async (pkg: any) => {
        try {
            await purchasesService.purchasePackage(pkg);
            await refreshSubscription();
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    return (
        <SubscriptionContext.Provider
            value={{
                isPro,
                subscriptionTier,
                restorePurchases,
                purchasePackage,
                refreshSubscription,
                offerings,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}
