import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';

const PASSCODE_STORAGE_KEY = '@turn_pro_poker_passcode';
const PASSCODE_LENGTH = 4;

interface PasscodeLockContextType {
    isLocked: boolean;
    hasPasscode: boolean;
    isLoading: boolean;
    setPasscode: (pin: string) => Promise<void>;
    removePasscode: () => Promise<void>;
    verifyPasscode: (pin: string) => boolean;
    unlockApp: () => void;
    lockApp: () => void;
}

const PasscodeLockContext = createContext<PasscodeLockContextType | undefined>(undefined);

export const usePasscodeLock = () => {
    const context = useContext(PasscodeLockContext);
    if (!context) {
        throw new Error('usePasscodeLock must be used within PasscodeLockProvider');
    }
    return context;
};

interface PasscodeLockProviderProps {
    children: ReactNode;
    isAuthenticated: boolean; // Only lock when user is logged in
}

export const PasscodeLockProvider: React.FC<PasscodeLockProviderProps> = ({ children, isAuthenticated }) => {
    const [isLocked, setIsLocked] = useState(false);
    const [hasPasscode, setHasPasscode] = useState(false);
    const [storedPasscode, setStoredPasscode] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

    // Load passcode on mount
    useEffect(() => {
        const loadPasscode = async () => {
            try {
                const saved = await AsyncStorage.getItem(PASSCODE_STORAGE_KEY);
                if (saved) {
                    setStoredPasscode(saved);
                    setHasPasscode(true);
                }
            } catch (e) {
                console.error('Failed to load passcode:', e);
            } finally {
                setIsLoading(false);
            }
        };
        loadPasscode();
    }, []);

    // Listen for app state changes (background/foreground)
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // App coming back to foreground
            if (appState.match(/inactive|background/) && nextAppState === 'active') {
                // Lock app if user is authenticated and has passcode set
                if (isAuthenticated && hasPasscode && storedPasscode) {
                    setIsLocked(true);
                }
            }
            setAppState(nextAppState);
        });

        return () => {
            subscription.remove();
        };
    }, [appState, isAuthenticated, hasPasscode, storedPasscode]);

    const setPasscode = useCallback(async (pin: string) => {
        if (pin.length !== PASSCODE_LENGTH) {
            throw new Error(`Passcode must be ${PASSCODE_LENGTH} digits`);
        }
        await AsyncStorage.setItem(PASSCODE_STORAGE_KEY, pin);
        setStoredPasscode(pin);
        setHasPasscode(true);
    }, []);

    const removePasscode = useCallback(async () => {
        await AsyncStorage.removeItem(PASSCODE_STORAGE_KEY);
        setStoredPasscode(null);
        setHasPasscode(false);
        setIsLocked(false);
    }, []);

    const verifyPasscode = useCallback((pin: string): boolean => {
        return pin === storedPasscode;
    }, [storedPasscode]);

    const unlockApp = useCallback(() => {
        setIsLocked(false);
    }, []);

    const lockApp = useCallback(() => {
        if (hasPasscode && storedPasscode) {
            setIsLocked(true);
        }
    }, [hasPasscode, storedPasscode]);

    return (
        <PasscodeLockContext.Provider
            value={{
                isLocked,
                hasPasscode,
                isLoading,
                setPasscode,
                removePasscode,
                verifyPasscode,
                unlockApp,
                lockApp,
            }}
        >
            {children}
        </PasscodeLockContext.Provider>
    );
};

export { PASSCODE_LENGTH };
