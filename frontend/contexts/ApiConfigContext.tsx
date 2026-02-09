import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Web-compatible storage wrapper
const storage = {
    async getItem(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async setItem(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return SecureStore.setItemAsync(key, value);
    },
};

interface ApiConfigContextType {
    apiBaseUrl: string;
    setApiBaseUrl: (url: string) => Promise<void>;
    resetToDefault: () => Promise<void>;
}

const ApiConfigContext = createContext<ApiConfigContextType | undefined>(undefined);

const DEFAULT_URLS = {
    production: 'https://turn-pro-poker-api.onrender.com/api/v1',
    local: 'http://192.168.1.152:8000/api/v1',
};

export function ApiConfigProvider({ children }: { children: React.ReactNode }) {
    const [apiBaseUrl, setApiBaseUrlState] = useState<string>(DEFAULT_URLS.production);

    useEffect(() => {
        loadStoredUrl();
    }, []);

    const loadStoredUrl = async () => {
        try {
            const stored = await storage.getItem('api_base_url');
            if (stored) {
                setApiBaseUrlState(stored);
                console.log('📡 Loaded API URL from storage:', stored);
            } else {
                setApiBaseUrlState(DEFAULT_URLS.production);
                console.log('📡 Using default API URL:', DEFAULT_URLS.production);
            }
        } catch (error) {
            console.error('Error loading API URL:', error);
        }
    };

    const setApiBaseUrl = async (url: string) => {
        try {
            await storage.setItem('api_base_url', url);
            setApiBaseUrlState(url);
            console.log('✅ API URL saved:', url);
        } catch (error) {
            console.error('Error saving API URL:', error);
            throw error;
        }
    };

    const resetToDefault = async () => {
        await setApiBaseUrl(DEFAULT_URLS.production);
    };

    return (
        <ApiConfigContext.Provider value={{ apiBaseUrl, setApiBaseUrl, resetToDefault }}>
            {children}
        </ApiConfigContext.Provider>
    );
}

export function useApiConfig() {
    const context = useContext(ApiConfigContext);
    if (!context) {
        throw new Error('useApiConfig must be used within ApiConfigProvider');
    }
    return context;
}
