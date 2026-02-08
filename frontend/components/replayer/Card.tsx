import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface CardProps {
    rank?: string;
    suit?: 'h' | 'd' | 'c' | 's';
    hidden?: boolean;
    style?: any;
}

export const Card: React.FC<CardProps> = ({ rank, suit, hidden, style }) => {
    if (hidden) {
        return (
            <View style={[styles.card, styles.hiddenCard, style]}>
                <View style={styles.pattern} />
            </View>
        );
    }

    if (!rank || !suit) return <View style={[styles.card, styles.placeholder, style]} />;

    const getSuitColor = (s: string) => {
        switch (s) {
            case 'h': return '#ef4444'; // Red
            case 'd': return '#3b82f6'; // Blue (standard 4-color deck)
            case 'c': return '#22c55e'; // Green
            case 's': return '#000000'; // Black
            default: return '#000';
        }
    };

    const getSuitSymbol = (s: string) => {
        switch (s) {
            case 'h': return '♥';
            case 'd': return '♦';
            case 'c': return '♣';
            case 's': return '♠';
            default: return '?';
        }
    };

    const color = getSuitColor(suit);

    return (
        <View style={[styles.card, styles.faceCard, style]}>
            <Text style={[styles.rank, { color }]}>{rank}</Text>
            <Text style={[styles.suit, { color }]}>{getSuitSymbol(suit)}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: 34,
        height: 48,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 1,
    },
    hiddenCard: {
        backgroundColor: '#b91c1c', // Deep Red
        borderColor: '#fff',
    },
    pattern: {
        width: '80%',
        height: '80%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 2,
    },
    faceCard: {
        backgroundColor: '#fff',
    },
    placeholder: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    rank: {
        fontWeight: 'bold',
        fontSize: 16,
        lineHeight: 18,
    },
    suit: {
        fontSize: 14,
        lineHeight: 14,
    }
});
