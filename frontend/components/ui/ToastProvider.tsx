import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const TOAST_DURATION = 2500;
const SLIDE_DURATION = 300;

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
    success: 'checkmark-circle',
    error: 'alert-circle',
    info: 'information-circle',
};

const BG_COLORS: Record<ToastType, string> = {
    success: 'rgba(16, 185, 129, 0.95)',
    error: 'rgba(239, 68, 68, 0.95)',
    info: 'rgba(59, 130, 246, 0.95)',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const translateY = useRef(new Animated.Value(-100)).current;
    const opacity = useRef(new Animated.Value(0)).current;
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        // Cancel any existing timeout
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Set toast data
        setToast({ message, type });

        // Slide in
        translateY.setValue(-100);
        opacity.setValue(0);
        Animated.parallel([
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, damping: 15 }),
            Animated.timing(opacity, { toValue: 1, duration: SLIDE_DURATION, useNativeDriver: true }),
        ]).start();

        // Auto dismiss
        timeoutRef.current = setTimeout(() => {
            Animated.parallel([
                Animated.timing(translateY, { toValue: -100, duration: SLIDE_DURATION, useNativeDriver: true }),
                Animated.timing(opacity, { toValue: 0, duration: SLIDE_DURATION, useNativeDriver: true }),
            ]).start(() => setToast(null));
        }, TOAST_DURATION);
    }, [translateY, opacity]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {toast && (
                <Animated.View
                    style={[
                        styles.toastContainer,
                        { backgroundColor: BG_COLORS[toast.type], transform: [{ translateY }], opacity },
                    ]}
                    pointerEvents="none"
                >
                    <Ionicons name={ICONS[toast.type]} size={20} color="#fff" />
                    <Text style={styles.toastText} numberOfLines={2}>{toast.message}</Text>
                </Animated.View>
            )}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

const styles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: Platform.OS === 'android' ? (StatusBar.currentHeight || 40) + 8 : 50,
        left: 16,
        right: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
        zIndex: 99999,
        elevation: 99999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    toastText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        flex: 1,
    },
});
