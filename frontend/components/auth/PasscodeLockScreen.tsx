import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { usePasscodeLock, PASSCODE_LENGTH } from '../../contexts/PasscodeLockContext';
import { useAuth } from '../../contexts/AuthContext';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Lock Icon
const LockIcon = () => (
    <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
        <Path
            d="M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z"
            stroke={COLORS.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M7 11V7a5 5 0 0110 0v4"
            stroke={COLORS.accent}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

// Backspace Icon
const BackspaceIcon = () => (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
            d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"
            stroke={COLORS.text}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M18 9l-6 6M12 9l6 6"
            stroke={COLORS.text}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);

export const PasscodeLockScreen: React.FC = () => {
    const { verifyPasscode, unlockApp } = usePasscodeLock();
    const { signOut } = useAuth();
    const [enteredPin, setEnteredPin] = useState('');
    const [error, setError] = useState(false);
    const shakeAnim = useState(new Animated.Value(0))[0];

    // Shake animation for wrong PIN
    const triggerShake = useCallback(() => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    }, [shakeAnim]);

    // Check PIN when complete
    useEffect(() => {
        if (enteredPin.length === PASSCODE_LENGTH) {
            if (verifyPasscode(enteredPin)) {
                unlockApp();
            } else {
                setError(true);
                triggerShake();
                setTimeout(() => {
                    setEnteredPin('');
                    setError(false);
                }, 500);
            }
        }
    }, [enteredPin, verifyPasscode, unlockApp, triggerShake]);

    const handlePress = (digit: string) => {
        if (enteredPin.length < PASSCODE_LENGTH) {
            setEnteredPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setEnteredPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const handleLogout = async () => {
        await signOut();
        unlockApp();
    };

    // Number pad layout
    const numPad = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'back'],
    ];

    return (
        <LinearGradient
            colors={[COLORS.bg, COLORS.bgGradientEnd]}
            style={styles.container}
        >
            {/* Lock Icon */}
            <View style={styles.iconContainer}>
                <LockIcon />
            </View>

            {/* Title */}
            <Text style={styles.title}>Enter Passcode</Text>
            <Text style={styles.subtitle}>Enter your 4-digit PIN to unlock</Text>

            {/* PIN Dots */}
            <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
                {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
                    <View
                        key={i}
                        style={[
                            styles.dot,
                            enteredPin.length > i && styles.dotFilled,
                            error && styles.dotError,
                        ]}
                    />
                ))}
            </Animated.View>

            {/* Number Pad */}
            <View style={styles.numPad}>
                {numPad.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.numRow}>
                        {row.map((item, colIndex) => {
                            if (item === '') {
                                return <View key={colIndex} style={styles.numButton} />;
                            }
                            if (item === 'back') {
                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={styles.numButton}
                                        onPress={handleBackspace}
                                    >
                                        <BackspaceIcon />
                                    </TouchableOpacity>
                                );
                            }
                            return (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={styles.numButton}
                                    onPress={() => handlePress(item)}
                                >
                                    <Text style={styles.numText}>{item}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                ))}
            </View>

            {/* Forgot PIN */}
            <TouchableOpacity style={styles.forgotButton} onPress={handleLogout}>
                <Text style={styles.forgotText}>Forgot PIN? Log out</Text>
            </TouchableOpacity>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 32,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 48,
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: COLORS.muted,
        backgroundColor: 'transparent',
    },
    dotFilled: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    dotError: {
        backgroundColor: COLORS.danger,
        borderColor: COLORS.danger,
    },
    numPad: {
        width: Math.min(width - 80, 300),
    },
    numRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    numButton: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numText: {
        fontSize: 28,
        fontWeight: '600',
        color: COLORS.text,
    },
    forgotButton: {
        marginTop: 32,
        padding: 12,
    },
    forgotText: {
        fontSize: 14,
        color: COLORS.muted,
    },
});
