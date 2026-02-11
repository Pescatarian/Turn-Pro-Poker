import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';

interface PrivacyContextType {
    privacyMode: boolean;
    togglePrivacy: () => void;
}

const PrivacyContext = createContext<PrivacyContextType>({
    privacyMode: false,
    togglePrivacy: () => { },
});

const STORAGE_KEY = 'privacy_mode';

export function PrivacyProvider({ children }: { children: ReactNode }) {
    const [privacyMode, setPrivacyMode] = useState(false);

    useEffect(() => {
        SecureStore.getItemAsync(STORAGE_KEY).then(val => {
            if (val === 'true') setPrivacyMode(true);
        });
    }, []);

    const togglePrivacy = () => {
        setPrivacyMode(prev => {
            const next = !prev;
            SecureStore.setItemAsync(STORAGE_KEY, String(next));
            return next;
        });
    };

    return (
        <PrivacyContext.Provider value={{ privacyMode, togglePrivacy }}>
            {children}
        </PrivacyContext.Provider>
    );
}

export function usePrivacy() {
    return useContext(PrivacyContext);
}
