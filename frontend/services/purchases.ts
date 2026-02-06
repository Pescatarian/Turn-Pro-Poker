import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Replace with your actual RevenueCat API keys
const API_KEYS = {
    ios: 'appl_your_ios_api_key',
    android: 'goog_your_android_api_key',
};

class PurchasesService {
    async init(userID: string) {
        if (Platform.OS === 'web') return; // Not supported on web

        // Skip RevenueCat in Expo Go (StoreClient)
        if (Constants.executionEnvironment === 'storeClient') {
            console.log('Skipping RevenueCat initialization in Expo Go');
            return;
        }

        Purchases.setLogLevel(Purchases.LOG_LEVEL.DEBUG);

        if (Platform.OS === 'ios') {
            await Purchases.configure({ apiKey: API_KEYS.ios, appUserID: userID });
        } else if (Platform.OS === 'android') {
            await Purchases.configure({ apiKey: API_KEYS.android, appUserID: userID });
        }
    }

    async getOfferings(): Promise<any | null> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null) {
                return offerings.current;
            }
        } catch (e) {
            console.error('Error fetching offerings', e);
        }
        return null;
    }

    async purchasePackage(packageToPurchase: any) {
        try {
            const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
            return customerInfo;
        } catch (e: any) {
            if (!e.userCancelled) {
                console.error('Error purchasing package', e);
                throw e;
            }
        }
    }

    async checkSubscriptionStatus() {
        try {
            const customerInfo = await Purchases.getCustomerInfo();
            // Check for 'pro' entitlement (configure this in RevenueCat dashboard)
            return customerInfo.entitlements.active['pro'] !== undefined;
        } catch (e) {
            console.error('Error checking subscription', e);
            return false;
        }
    }

    async restorePurchases() {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return customerInfo;
        } catch (e) {
            console.error('Error restoring purchases', e);
            throw e;
        }
    }
}

export const purchasesService = new PurchasesService();
