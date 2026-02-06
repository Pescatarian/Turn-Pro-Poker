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

// Use your computer's IP for Android Emulator or localhost for iOS Simulator
// Replace with your actual backend URL when deploying
const BASE_URL = 'http://localhost:8000/api/v1'

export const api = axios.create({
    baseURL: BASE_URL,
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

// Add interceptor to handle 401s (token expiry)
api.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
        if (error.response?.status === 401) {
            // Handle logout or refresh (future task)
            await storage.deleteItemAsync('token')
        }
        return Promise.reject(error)
    }
)

