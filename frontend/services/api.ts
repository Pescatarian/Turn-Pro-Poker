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

// Backend URL - automatically uses production Render URL
// For local development, uncomment the localhost line
const BASE_URL = __DEV__
    ? 'http://192.168.1.152:8000/api/v1'  // Local development
    : 'https://turn-pro-poker-api.onrender.com/api/v1'  // Production

export const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000, // 15 seconds timeout (Render free tier can have cold starts)
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add interceptor to add token
api.interceptors.request.use(
    async (config: any) => {
        const token = await storage.getItemAsync('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error: any) => Promise.reject(error)
)

// Add interceptor to handle errors
api.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        if (error.code === 'ERR_NETWORK') {
            console.error('API Connection Error: ', error.message, error.config?.url);
            console.error('Make sure your phone is on the same Wi-Fi as your computer.');
            console.error('Check firewall settings on your computer.');
        }

        if (error.response?.status === 401) {
            // Handle logout or refresh (future task)
            await storage.deleteItemAsync('token')
        }
        return Promise.reject(error)
    }
)


