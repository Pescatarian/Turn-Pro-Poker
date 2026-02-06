import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { purchasesService } from '../services/purchases';
import { useAuth } from './AuthContext';
import { CustomerInfo } from 'react-native-purchases';

type SubscriptionContextType = {
    isPro: boolean;
    restorePurchases: () => Promise<void>;
    purchasePackage: (pkg: any) => Promise<void>;
    offerings: any; // Using any for simplicity now, ideally PurchasesOffering
};

const SubscriptionContext = createContext<SubscriptionContextType>({
    isPro: false,
    restorePurchases: async () => { },
    purchasePackage: async () => { },
    offerings: null,
});

export const useSubscription = () => useContext(SubscriptionContext);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const [isPro, setIsPro] = useState(false);
    const [offerings, setOfferings] = useState<any>(null);

    useEffect(() => {
        // Skip RevenueCat on web - IAP doesn't work in browsers
        if (Platform.OS === 'web') {
            return;
        }

        if (user) {
            // Initialize purchases when user logs in
            const initPurchases = async () => {
                // Use database ID or a stable ID for RevenueCat
                await purchasesService.init(user.id.toString());

                const isSubscribed = await purchasesService.checkSubscriptionStatus();
                setIsPro(isSubscribed);

                const currentOfferings = await purchasesService.getOfferings();
                setOfferings(currentOfferings);
            };

            initPurchases();
        } else {
            // Reset if no user
            setIsPro(false);
            setOfferings(null);
        }
    }, [user]);

    const restorePurchases = async () => {
        try {
            await purchasesService.restorePurchases();
            // Re-check status
            const isSubscribed = await purchasesService.checkSubscriptionStatus();
            setIsPro(isSubscribed);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    const purchasePackage = async (pkg: any) => {
        try {
            await purchasesService.purchasePackage(pkg);
            // Re-check status
            const isSubscribed = await purchasesService.checkSubscriptionStatus();
            setIsPro(isSubscribed);
        } catch (e) {
            console.error(e);
            throw e;
        }
    };

    return (
        <SubscriptionContext.Provider
            value={{
                isPro,
                restorePurchases,
                purchasePackage,
                offerings,
            }}
        >
            {children}
        </SubscriptionContext.Provider>
    );
}
