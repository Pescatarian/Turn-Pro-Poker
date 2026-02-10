import Purchases, { PurchasesOffering, CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// RevenueCat API Keys
const API_KEYS = {
    ios: process.env.REVENUECAT_IOS_API_KEY || 'appl_your_ios_api_key', // TODO: Add iOS key when ready
    android: 'goog_NzyhBOPamtWqMuMCqYRPkNOwvOq', // Android key from RevenueCat
};

export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionStatus {
    tier: SubscriptionTier;
    isActive: boolean;
    expiresAt?: Date;
}

class PurchasesService {
    private initialized = false;

    async init(userID: string): Promise<void> {
        if (this.initialized) return;

        if (Platform.OS === 'web') {
            console.log('RevenueCat not supported on web');
            return;
        }

        // Skip RevenueCat in Expo Go (StoreClient)
        if (Constants.executionEnvironment === 'storeClient') {
            console.log('Skipping RevenueCat initialization in Expo Go');
            return;
        }

        try {
            Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

            if (Platform.OS === 'ios') {
                await Purchases.configure({ apiKey: API_KEYS.ios, appUserID: userID });
            } else if (Platform.OS === 'android') {
                await Purchases.configure({ apiKey: API_KEYS.android, appUserID: userID });
            }

            this.initialized = true;
            console.log('✅ RevenueCat initialized for user:', userID);
        } catch (error) {
            console.error('❌ RevenueCat initialization failed:', error);
            throw error;
        }
    }

    async getOfferings(): Promise<any | null> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
            console.warn('No current offering found');
        } catch (e) {
            console.error('Error fetching offerings:', e);
        }
        return null;
    }

    async purchasePackage(packageToPurchase: any): Promise<any | null> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            console.log('✅ Purchase successful:', customerInfo);
            return customerInfo;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('❌ Error purchasing package:', e);
                throw e;
            }
            console.log('User cancelled purchase');
            return null;
        }
    }

    async getSubscriptionStatus(): Promise<SubscriptionStatus> {
        try {
            const customerInfo = await Purchases.getCustomerInfo();

            // Check entitlements (configured in RevenueCat dashboard)
            // User configured: "Pro" and "Semi-Pro" entitlements
            const hasProEntitlement = customerInfo.entitlements.active['Pro'] !== undefined;
            const hasSemiProEntitlement = customerInfo.entitlements.active['Semi-Pro'] !== undefined;

            let tier: SubscriptionTier = 'free';
            let expiresAt: Date | undefined;

            if (hasProEntitlement) {
                tier = 'pro';
                const entitlement = customerInfo.entitlements.active['Pro'];
                expiresAt = entitlement?.expirationDate ? new Date(entitlement.expirationDate) : undefined;
            } else if (hasSemiProEntitlement) {
                tier = 'premium';  // Map Semi-Pro to our "premium" tier
                const entitlement = customerInfo.entitlements.active['Semi-Pro'];
                expiresAt = entitlement?.expirationDate ? new Date(entitlement.expirationDate) : undefined;
            }

            return {
                tier,
                isActive: hasProEntitlement || hasSemiProEntitlement,
                expiresAt,
            };
        } catch (e) {
            console.error('Error checking subscription status:', e);
            return {
                tier: 'free',
                isActive: false,
            };
        }
    }

    async restorePurchases(): Promise<any> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            console.log('✅ Purchases restored successfully');
            return customerInfo;
        } catch (e) {
            console.error('❌ Error restoring purchases:', e);
            throw e;
        }
    }

    /**
     * Check if user has access to a specific feature based on subscription tier
     */
    canAccessFeature(feature: string, currentTier: SubscriptionTier): boolean {
        const featureAccess: Record<string, SubscriptionTier[]> = {
            // Free features
            'basic_tracking': ['free', 'premium', 'pro'],
            'basic_stats': ['free', 'premium', 'pro'],

            // Premium features
            'advanced_stats': ['premium', 'pro'],
            'export_csv': ['premium', 'pro'],
            'export_pdf': ['premium', 'pro'],
            'hand_replayer': ['premium', 'pro'],
            'unlimited_sessions': ['premium', 'pro'],

            // Pro features
            'priority_support': ['pro'],
            'early_access': ['pro'],
        };

        const allowedTiers = featureAccess[feature] || [];
        return allowedTiers.includes(currentTier);
    }
}

export const purchasesService = new PurchasesService();
