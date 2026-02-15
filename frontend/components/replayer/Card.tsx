import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CardProps {
    rank?: string;
    suit?: 'h' | 'd' | 'c' | 's';
    hidden?: boolean;
    revealed?: boolean;
    style?: ViewStyle;
    size?: 'small' | 'normal' | 'large';
}

// Rich suit-themed gradients
const SUIT_GRADIENT: Record<string, [string, string]> = {
    h: ['#b91c1c', '#7f1d1d'],   // Crisp dark red
    d: ['#1d4ed8', '#1e3a8a'],   // Crisp dark blue
    c: ['#15803d', '#14532d'],   // Crisp dark green
    s: ['#1f2937', '#030712'],   // Black
};

const SUIT_SYMBOL: Record<string, string> = {
    h: '♥\uFE0E',
    d: '♦\uFE0E',
    c: '♣\uFE0E',
    s: '♠\uFE0E',
};

export const Card: React.FC<CardProps> = ({ rank, suit, hidden = false, revealed = false, style, size = 'normal' }) => {
    const dim = SIZES[size];

    // Hidden card (face down) — solid red back with inner pattern
    if (hidden && !revealed) {
        return (
            <View style={[styles.cardBase, dim.card, styles.hiddenCard, style]} />
        );
    }

    // Unknown card — ? placeholder
    if (rank === '?') {
        return (
            <View style={[styles.cardBase, dim.card, styles.unknownCard, style]}>
                <Text style={[styles.centerRank, { fontSize: dim.rankFont, color: '#999' }]}>?</Text>
            </View>
        );
    }

    // Empty slot (dashed border, no card assigned)
    if (!rank || !suit) {
        return (
            <View style={[styles.cardBase, dim.card, styles.emptySlot, style]} />
        );
    }

    // Revealed card — gradient bg, big rank center, small suit top-left
    const gradient = SUIT_GRADIENT[suit] || SUIT_GRADIENT.s;

    return (
        <LinearGradient
            colors={gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.cardBase, dim.card, styles.revealedCard, style]}
        >
            {/* Small suit icon — top left */}
            <Text style={[styles.suitCorner, { fontSize: dim.suitFont }]}>
                {SUIT_SYMBOL[suit]}
            </Text>

            {/* Big rank — center */}
            <Text style={[styles.centerRank, { fontSize: dim.rankFont }]}>
                {rank}
            </Text>
        </LinearGradient>
    );
};

// Size presets
const SIZES = {
    small: {
        card: { width: 28, height: 38, borderRadius: 4 } as ViewStyle,
        rankFont: 18,
        suitFont: 9,
    },
    normal: {
        card: { width: 32, height: 44, borderRadius: 4 } as ViewStyle,
        rankFont: 20,
        suitFont: 10,
    },
    large: {
        card: { width: 36, height: 50, borderRadius: 5 } as ViewStyle,
        rankFont: 22,
        suitFont: 11,
    },
};

const styles = StyleSheet.create({
    cardBase: {
        marginHorizontal: 1,
        overflow: 'hidden',
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },

    /* Revealed card */
    revealedCard: {
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    suitCorner: {
        position: 'absolute',
        top: 1,
        left: 3,
        color: '#fff',
        fontWeight: '400',
    },
    centerRank: {
        color: '#fff',
        fontWeight: '900',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
        marginTop: 4, // slight push down to account for the suit icon space
    },

    /* Hidden card (face down) */
    hiddenCard: {
        backgroundColor: '#c41e3a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },

    /* Unknown card (?) */
    unknownCard: {
        backgroundColor: '#444',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
    },

    /* Empty slot */
    emptySlot: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.3)',
    },
});
