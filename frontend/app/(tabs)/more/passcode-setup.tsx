import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { GlassCard } from '../../../components/ui/GlassCard';
import { COLORS } from '../../../constants/theme';
import { usePasscodeLock, PASSCODE_LENGTH } from '../../../contexts/PasscodeLockContext';
import Svg, { Path } from 'react-native-svg';

type SetupStep = 'enter' | 'confirm' | 'success';

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

export default function PasscodeSetupScreen() {
    const router = useRouter();
    const { hasPasscode, setPasscode, removePasscode } = usePasscodeLock();

    const [step, setStep] = useState<SetupStep>('enter');
    const [firstPin, setFirstPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState(false);
    const shakeAnim = useState(new Animated.Value(0))[0];

    const currentPin = step === 'enter' ? firstPin : confirmPin;
    const setCurrentPin = step === 'enter' ? setFirstPin : setConfirmPin;

    // Shake animation
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
        ]).start();
    };

    // Handle PIN completion
    useEffect(() => {
        if (step === 'enter' && firstPin.length === PASSCODE_LENGTH) {
            setTimeout(() => setStep('confirm'), 300);
        } else if (step === 'confirm' && confirmPin.length === PASSCODE_LENGTH) {
            if (confirmPin === firstPin) {
                handleSavePasscode();
            } else {
                setError(true);
                triggerShake();
                setTimeout(() => {
                    setConfirmPin('');
                    setError(false);
                }, 500);
            }
        }
    }, [firstPin, confirmPin, step]);

    const handleSavePasscode = async () => {
        try {
            await setPasscode(confirmPin);
            setStep('success');
            setTimeout(() => {
                router.back();
            }, 1500);
        } catch (e) {
            Alert.alert('Error', 'Failed to save passcode');
        }
    };

    const handleDisablePasscode = async () => {
        Alert.alert(
            'Disable Passcode',
            'Are you sure you want to disable passcode lock?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Disable',
                    style: 'destructive',
                    onPress: async () => {
                        await removePasscode();
                        router.back();
                    },
                },
            ]
        );
    };

    const handlePress = (digit: string) => {
        if (currentPin.length < PASSCODE_LENGTH) {
            setCurrentPin(prev => prev + digit);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setCurrentPin(prev => prev.slice(0, -1));
        setError(false);
    };

    const getTitle = () => {
        if (step === 'enter') return 'Enter New Passcode';
        if (step === 'confirm') return 'Confirm Passcode';
        return 'Passcode Set!';
    };

    const getSubtitle = () => {
        if (step === 'enter') return 'Choose a 4-digit PIN';
        if (step === 'confirm') return 'Enter the same PIN again';
        return 'Your app is now protected';
    };

    // Number pad layout
    const numPad = [
        ['1', '2', '3'],
        ['4', '5', '6'],
        ['7', '8', '9'],
        ['', '0', 'back'],
    ];

    if (step === 'success') {
        return (
            <ScreenWrapper hideHeader>
                <View style={styles.successContainer}>
                    <Text style={styles.successIcon}>✓</Text>
                    <Text style={styles.title}>{getTitle()}</Text>
                    <Text style={styles.subtitle}>{getSubtitle()}</Text>
                </View>
            </ScreenWrapper>
        );
    }

    return (
        <ScreenWrapper hideHeader>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                        <Text style={styles.backText}>← Back</Text>
                    </TouchableOpacity>
                    {hasPasscode && (
                        <TouchableOpacity onPress={handleDisablePasscode}>
                            <Text style={styles.disableText}>Disable</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Title */}
                <Text style={styles.title}>{getTitle()}</Text>
                <Text style={styles.subtitle}>{getSubtitle()}</Text>

                {/* PIN Dots */}
                <Animated.View style={[styles.dotsContainer, { transform: [{ translateX: shakeAnim }] }]}>
                    {Array.from({ length: PASSCODE_LENGTH }).map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                currentPin.length > i && styles.dotFilled,
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
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        paddingHorizontal: 16,
        marginBottom: 40,
    },
    backBtn: {
        padding: 8,
    },
    backText: {
        color: COLORS.text,
        fontSize: 16,
    },
    disableText: {
        color: COLORS.danger,
        fontSize: 16,
        padding: 8,
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
        marginBottom: 40,
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
        width: 280,
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
    successContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    successIcon: {
        fontSize: 64,
        color: COLORS.accent,
        marginBottom: 24,
    },
});
