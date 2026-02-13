import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface CardProps {
    rank?: string;
    suit?: 'h' | 'd' | 'c' | 's';
    hidden?: boolean;
    revealed?: boolean;
    style?: ViewStyle;
    size?: 'small' | 'normal' | 'large';
}

const SUIT_BG: Record<string, string> = {
    h: '#991b1b',
    d: '#1e40af',
    c: '#166534',
    s: '#000',
};

const SUIT_SYMBOL: Record<string, string> = {
    h: '♥',
    d: '♦',
    c: '♣',
    s: '♠',
};

export const Card: React.FC<CardProps> = ({ rank, suit, hidden = false, revealed = false, style, size = 'normal' }) => {
    const sizeStyle = size === 'small' ? styles.cardSmall : size === 'large' ? styles.cardLarge : styles.card;

    // Hidden card (face down) — solid red back
    if (hidden && !revealed) {
        return (
            <View style={[sizeStyle, styles.hiddenCard, style]} />
        );
    }

    // Empty slot (dashed border, no card assigned)
    if (!rank || !suit) {
        return (
            <View style={[sizeStyle, styles.emptySlot, style]} />
        );
    }

    // Revealed card — suit-colored background matching index.html
    const bgColor = SUIT_BG[suit] || '#000';

    return (
        <View style={[sizeStyle, { backgroundColor: bgColor, borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)', borderRadius: 4 }, style]}>
            <Text style={[styles.rank, size === 'small' && styles.rankSmall]}>{rank}</Text>
            <Text style={[styles.suit, size === 'small' && styles.suitSmall]}>{SUIT_SYMBOL[suit]}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 32,
        height: 44,
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 1,
    },
    cardSmall: {
        width: 28,
        height: 38,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 1,
    },
    cardLarge: {
        width: 36,
        height: 50,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 2,
    },
    hiddenCard: {
        backgroundColor: '#c41e3a',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },
    pattern: {
        width: '70%',
        height: '70%',
        backgroundColor: '#8b0000',
        borderRadius: 2,
    },
    emptySlot: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: 'rgba(255,255,255,0.3)',
        borderRadius: 4,
    },
    rank: {
        fontWeight: 'bold',
        fontSize: 20,
        lineHeight: 22,
        color: '#fff',
    },
    rankSmall: {
        fontSize: 16,
        lineHeight: 18,
    },
    suit: {
        fontSize: 12,
        lineHeight: 14,
        color: '#fff',
    },
    suitSmall: {
        fontSize: 10,
        lineHeight: 12,
    },
});
