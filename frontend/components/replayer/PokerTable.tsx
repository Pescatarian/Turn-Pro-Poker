import React from 'react';
import { View, Text, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../../constants/theme';
import { Card } from './Card';
import { GlassCard } from '../ui/GlassCard';

/*
  Seat Layout Strategy (Clockwise from Bottom Center)
  We use percentages for positioning to be responsive-ish.
  Hero is usually Bottom Center (Seat 1).
*/
const SEAT_POSITIONS = [
    { id: 1, bottom: '0%', left: '50%', transform: [{ translateX: -35 }, { translateY: 0 }] }, // Hero
    { id: 2, bottom: '18%', left: '2%', transform: [{ translateX: 0 }] },
    { id: 3, top: '50%', left: '-2%', transform: [{ translateY: -30 }] },
    { id: 4, top: '15%', left: '2%', transform: [{ translateX: 0 }] },
    { id: 5, top: '-5%', left: '25%', transform: [{ translateX: 0 }] }, // Top Left
    { id: 6, top: '-5%', right: '25%', transform: [{ translateX: 0 }] }, // Top Right
    { id: 7, top: '15%', right: '2%', transform: [{ translateX: 0 }] },
    { id: 8, top: '50%', right: '-2%', transform: [{ translateY: -30 }] },
    { id: 9, bottom: '18%', right: '2%', transform: [{ translateX: 0 }] },
];

interface Player {
    id: number;
    name: string;
    stack: number;
    cards?: { rank: string; suit: 'h' | 'd' | 'c' | 's' }[];
    isActive?: boolean;
    isDealer?: boolean;
    action?: string; // 'check', 'bet', 'fold'
}

interface PokerTableProps {
    players: Player[];
    communityCards: { rank: string; suit: 'h' | 'd' | 'c' | 's' }[];
    pot: number;
    heroSeatId?: number;
}

const ACTION_BADGE_STYLES: Record<string, { backgroundColor: string }> = {
    fold: { backgroundColor: '#4b5563' },
    check: { backgroundColor: COLORS.accent },
    call: { backgroundColor: COLORS.accent },
    bet: { backgroundColor: COLORS.chartGold },
    raise: { backgroundColor: COLORS.danger },
};

const getActionBadgeStyle = (action: string) => ACTION_BADGE_STYLES[action] || {};

export const PokerTable: React.FC<PokerTableProps> = ({ players, communityCards, pot, heroSeatId = 1 }) => {
    return (
        <View style={styles.container}>
            {/* The Table Felt */}
            <View style={styles.tableWrapper}>
                <LinearGradient
                    colors={['#1a472a', '#0d2818']}
                    style={styles.tableFelt}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    {/* Center Info */}
                    <View style={styles.centerInfo}>
                        <Text style={styles.stakesText}>$5 / $10</Text>

                        {/* Community Cards */}
                        <View style={styles.communityCards}>
                            {[0, 1, 2, 3, 4].map((i) => (
                                <Card
                                    key={`board-${i}`}
                                    {...(communityCards[i] ? { ...communityCards[i], hidden: false } : { hidden: false })}
                                    style={!communityCards[i] ? styles.emptyCard : undefined}
                                />
                            ))}
                        </View>

                        {/* Pot */}
                        <View style={styles.potContainer}>
                            <Text style={styles.potLabel}>Pot: </Text>
                            <Text style={styles.potValue}>{pot}</Text>
                        </View>
                    </View>
                </LinearGradient>
            </View>

            {/* Players Area (Overlays the table) */}
            <View style={StyleSheet.absoluteFill}>
                {SEAT_POSITIONS.map((pos, index) => {
                    const player = players.find(p => p.id === pos.id);
                    const isHero = pos.id === heroSeatId;

                    if (!player) {
                        // Empty Seat
                        return (
                            <View key={pos.id} style={[styles.seatContainer, pos as any]}>
                                <View style={styles.emptySeat}>
                                    <Text style={styles.emptySeatText}>+</Text>
                                </View>
                            </View>
                        );
                    }

                    return (
                        <View key={pos.id} style={[styles.seatContainer, pos as any]}>
                            {/* Cards */}
                            <View style={[styles.playerCards, isHero && styles.heroCards]}>
                                <Card hidden={!isHero} rank={player.cards?.[0]?.rank} suit={player.cards?.[0]?.suit as any} />
                                <Card hidden={!isHero} rank={player.cards?.[1]?.rank} suit={player.cards?.[1]?.suit as any} />
                            </View>

                            {/* Player Info Box */}
                            <GlassCard style={[styles.playerInfo, isHero && styles.heroInfo, player.action === 'fold' && styles.foldedPlayer]} intensity={40}>
                                <Text style={styles.playerName} numberOfLines={1}>{player.name}</Text>
                                <Text style={styles.playerStack}>{player.stack}</Text>
                                {player.action && (
                                    <View style={[styles.actionBadge, getActionBadgeStyle(player.action)]}>
                                        <Text style={styles.actionText}>{player.action}</Text>
                                    </View>
                                )}
                                {player.isDealer && <View style={styles.dealerBtn}><Text style={styles.dealerText}>D</Text></View>}
                            </GlassCard>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 0.8, // Taller than wide for mobile vertical
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    tableWrapper: {
        width: '85%',
        aspectRatio: 0.7,
        borderRadius: 100,
        padding: 8,
        backgroundColor: '#111', // Outer Rim
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.8,
        shadowRadius: 20,
    },
    tableFelt: {
        flex: 1,
        borderRadius: 90,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    centerInfo: {
        alignItems: 'center',
        gap: 10,
    },
    stakesText: {
        color: 'rgba(255,255,255,0.5)',
        fontSize: 12,
        fontWeight: 'bold',
    },
    communityCards: {
        flexDirection: 'row',
        gap: 4,
        marginTop: 10,
    },
    emptyCard: {
        backgroundColor: 'rgba(0,0,0,0.2)',
        borderColor: 'rgba(255,255,255,0.1)',
    },
    potContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 10,
    },
    potLabel: {
        color: COLORS.muted,
        fontSize: 12,
    },
    potValue: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 14,
    },

    // Seats
    seatContainer: {
        position: 'absolute',
        alignItems: 'center',
        width: 70,
        height: 80,
    },
    emptySeat: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        marginTop: 30, // Push down to where stack would be
    },
    emptySeatText: {
        color: 'rgba(255,255,255,0.3)',
    },

    // Player
    playerCards: {
        flexDirection: 'row',
        marginBottom: -10, // Overlap stack slightly
        zIndex: 10,
    },
    heroCards: {
        transform: [{ scale: 1.2 }, { translateY: -10 }],
    },
    playerInfo: {
        width: 66,
        padding: 4,
        alignItems: 'center',
        borderRadius: 6,
        backgroundColor: '#fff', // Solid white override for visibility or use glass
        zIndex: 20,
    },
    heroInfo: {
        borderColor: COLORS.accent,
        borderWidth: 2,
    },
    foldedPlayer: {
        opacity: 0.5,
    },
    playerName: {
        fontSize: 10,
        fontWeight: 'bold',
        color: COLORS.text,
        textAlign: 'center',
    },
    playerStack: {
        fontSize: 10,
        color: COLORS.text,
        fontWeight: 'bold',
    },

    // Badges
    dealerBtn: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 30,
    },
    dealerText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#000',
    },
    actionBadge: {
        position: 'absolute',
        bottom: -8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        backgroundColor: '#333',
    },
    actionText: {
        fontSize: 8,
        color: '#fff',
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    foldBadge: { backgroundColor: '#4b5563' },
    checkBadge: { backgroundColor: COLORS.accent },
    callBadge: { backgroundColor: COLORS.accent },
    betBadge: { backgroundColor: COLORS.chartGold },
    raiseBadge: { backgroundColor: COLORS.danger },
});
