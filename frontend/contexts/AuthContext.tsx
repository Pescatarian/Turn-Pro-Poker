import React, { createContext, useContext, useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter, useSegments } from 'expo-router';
import { api } from '../services/api';

// Web-compatible storage wrapper
const storage = {
    async getItemAsync(key: string): Promise<string | null> {
        if (Platform.OS === 'web') {
            return localStorage.getItem(key);
        }
        return SecureStore.getItemAsync(key);
    },
    async setItemAsync(key: string, value: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.setItem(key, value);
            return;
        }
        return SecureStore.setItemAsync(key, value);
    },
    async deleteItemAsync(key: string): Promise<void> {
        if (Platform.OS === 'web') {
            localStorage.removeItem(key);
            return;
        }
        return SecureStore.deleteItemAsync(key);
    },
};

type AuthContextType = {
    signIn: (token: string) => Promise<void>;
    signOut: () => Promise<void>;
    user: any | null;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
    signIn: async () => { },
    signOut: async () => { },
    user: null,
    isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = await storage.getItemAsync('token');
                if (token) {
                    // Verify token and get user info
                    const response = await api.get('/users/me');
                    setUser(response.data);
                }
            } catch (error) {
                console.log('Auth check failed:', error);
                await storage.deleteItemAsync('token');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    useEffect(() => {
        if (isLoading) return;

        const inAuthGroup = (segments[0] as string) === '(auth)';

        if (!user && !inAuthGroup) {
            // Redirect to the sign-in page.
            router.replace('/(auth)/login' as any);
        } else if (user && inAuthGroup) {
            // Redirect away from the sign-in page.
            router.replace('/(tabs)/dashboard' as any);
        }
    }, [user, segments, isLoading]);

    const signIn = async (token: string) => {
        await storage.setItemAsync('token', token);
        // Fetch user details immediately after setting token
        try {
            const response = await api.get('/users/me');
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user on sign in", error);
        }
    };

    const signOut = async () => {
        await storage.deleteItemAsync('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                signIn,
                signOut,
                user,
                isLoading,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

