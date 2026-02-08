import React from 'react';
import { StyleSheet, View, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../constants/theme';

interface GlassCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, intensity = 20 }) => {
    // Web fallback
    if (Platform.OS === 'web') {
        return (
            <LinearGradient
                colors={GRADIENTS.card}
                style={[styles.container, style]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            >
                {children}
            </LinearGradient>
        );
    }

    return (
        <View style={[styles.container, styles.overflowHidden, style]}>
            <BlurView intensity={intensity} tint="dark" style={StyleSheet.absoluteFill} />
            <LinearGradient
                colors={GRADIENTS.card}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 0, y: 1 }}
            />
            {/* Content sits on top relatively */}
            <View style={{ flex: 1 }}>{children}</View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.glassBorder,
        marginBottom: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
        backgroundColor: 'rgba(255,255,255,0.01)', // Fallback bg
    },
    overflowHidden: {
        overflow: 'hidden',
    },
});

