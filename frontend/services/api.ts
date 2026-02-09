import axios from 'axios'
import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'

// Web-compatible storage wrapper
const storage = {
    async getItemAsync(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async deleteItemAsync(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return SecureStore.deleteItemAsync(key);
    },
};

// Backend URL - Loaded from device storage (configurable in-app!)
// Users can change this from the settings icon on login screen - NO REBUILD NEEDED!

let BASE_URL = 'https://turn-pro-poker-api.onrender.com/api/v1'; // Default fallback

// Load URL from storage on app start
storage.getItemAsync('api_base_url').then(url => {
    if (url) {
        BASE_URL = url;
        console.log('🌐 API Base URL (from storage):', BASE_URL);
    } else {
        console.log('🌐 API Base URL (default):', BASE_URL);
    }
}).catch(() => {
    console.log('🌐 API Base URL (default, storage error):', BASE_URL);
});

// Export function to get current URL dynamically
export const getBaseUrl = async () => {
    try {
        const stored = await storage.getItemAsync('api_base_url');
        return stored || BASE_URL;
    } catch {
        return BASE_URL;
    }
};



// Create API instance with dynamic baseURL
export const api = axios.create({
    timeout: 15000, // 15 seconds timeout (Render free tier can have cold starts)
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor to set baseURL dynamically from storage before each request
api.interceptors.request.use(
    async (config: any) => {
        // Get latest URL from storage
        const currentUrl = await getBaseUrl();
        config.baseURL = currentUrl;

        // Add auth token if available
        const token = await storage.getItemAsync('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: any) => Promise.reject(error)
);



// Add interceptor to handle errors
api.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('❌ API Connection Error:', error.message);
            console.error('📍 Trying to connect to:', error.config?.url);
            console.error('💡 Make sure backend is running and IP is correct in .env file');
        }

        if (error.response?.status === 401) {
            // Handle logout or refresh (future task)
            await storage.deleteItemAsync('token')
        }
        return Promise.reject(error)
    }
)


