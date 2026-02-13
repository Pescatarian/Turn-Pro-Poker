import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';

/*
  Seat layouts per table size.
  Each layout defines visual positions around the felt, clockwise from 6-o'clock (bottom center = hero seat).
  The index into the layout array corresponds to the SeatData index.
*/

export interface SeatData {
    position: string;
    stack: number;
    cards: string[]; // e.g. ['Ah', 'Kd']
    isHero: boolean;
    isDealer: boolean;
    isFolded: boolean;
    isActive: boolean;
    currentBet: number;
}

interface PokerTableProps {
    seats: SeatData[];
    communityCards: string[]; // e.g. ['Ah', '2c', 'Td', '', '']
    pot: number;
    stakes: string;
    tableSize: number;
    onPressSeat: (seatIndex: number) => void;
    onPressBoardSlot: (slotIndex: number) => void;
}

function parseCard(c: string): { rank: string; suit: 'h' | 'd' | 'c' | 's' } | null {
    if (!c || c.length < 2) return null;
    return { rank: c.slice(0, -1), suit: c.slice(-1) as any };
}

// --- Seat Layout Definitions ---
// Each entry: { style } for absolute positioning within the container.
// Clockwise from bottom-center (6 o'clock).

type SeatPos = { style: Record<string, any> };

const LAYOUT_9: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 1: 6 o'clock (hero)
    { style: { bottom: '18%', left: '2%' } },                                          // 2: ~7:30
    { style: { top: '48%', left: '-2%', transform: [{ translateY: -30 }] } },          // 3: 9 o'clock
    { style: { top: '18%', left: '2%' } },                                             // 4: ~10:30
    { style: { top: '-2%', left: '22%', transform: [{ translateX: -20 }] } },          // 5: ~11
    { style: { top: '-2%', right: '22%', transform: [{ translateX: 20 }] } },          // 6: ~1
    { style: { top: '18%', right: '2%' } },                                            // 7: ~1:30
    { style: { top: '48%', right: '-2%', transform: [{ translateY: -30 }] } },         // 8: 3 o'clock
    { style: { bottom: '18%', right: '2%' } },                                         // 9: ~4:30
];

const LAYOUT_8: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { bottom: '18%', left: '2%' } },
    { style: { top: '42%', left: '-2%', transform: [{ translateY: -30 }] } },
    { style: { top: '10%', left: '10%' } },
    { style: { top: '-2%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { top: '10%', right: '10%' } },
    { style: { top: '42%', right: '-2%', transform: [{ translateY: -30 }] } },
    { style: { bottom: '18%', right: '2%' } },
];

const LAYOUT_7: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { bottom: '18%', left: '2%' } },
    { style: { top: '30%', left: '-2%', transform: [{ translateY: -30 }] } },
    { style: { top: '-2%', left: '22%', transform: [{ translateX: -20 }] } },
    { style: { top: '-2%', right: '22%', transform: [{ translateX: 20 }] } },
    { style: { top: '30%', right: '-2%', transform: [{ translateY: -30 }] } },
    { style: { bottom: '18%', right: '2%' } },
];

const LAYOUT_6: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 6 o'clock
    { style: { bottom: '18%', left: '2%' } },                                          // ~8
    { style: { top: '18%', left: '2%' } },                                             // 10
    { style: { top: '-2%', left: '50%', transform: [{ translateX: -35 }] } },          // 12
    { style: { top: '18%', right: '2%' } },                                            // 2
    { style: { bottom: '18%', right: '2%' } },                                         // ~4
];

const LAYOUT_5: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { top: '40%', left: '-2%', transform: [{ translateY: -30 }] } },
    { style: { top: '-2%', left: '22%', transform: [{ translateX: -20 }] } },
    { style: { top: '-2%', right: '22%', transform: [{ translateX: 20 }] } },
    { style: { top: '40%', right: '-2%', transform: [{ translateY: -30 }] } },
];

const LAYOUT_4: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { top: '40%', left: '-2%', transform: [{ translateY: -30 }] } },
    { style: { top: '-2%', left: '50%', transform: [{ translateX: -35 }] } },
    { style: { top: '40%', right: '-2%', transform: [{ translateY: -30 }] } },
];

const LAYOUT_3: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // bottom
    { style: { top: '10%', left: '2%' } },                                             // top-left
    { style: { top: '10%', right: '2%' } },                                            // top-right
];

const LAYOUTS: Record<number, SeatPos[]> = {
    3: LAYOUT_3,
    4: LAYOUT_4,
    5: LAYOUT_5,
    6: LAYOUT_6,
    7: LAYOUT_7,
    8: LAYOUT_8,
    9: LAYOUT_9,
};

// Based on index.html — dealer on OPPOSITE side from bet chips.
function getDealerOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const layout = LAYOUTS[tableSize] || LAYOUT_9;
    const pos = layout[seatIndex]?.style || {};

    // Seat 1: bottom center
    if (pos.bottom !== undefined && pos.bottom === '0%') {
        return { top: -40, left: '50%', transform: [{ translateX: -16 }], right: undefined };
    }
    // Seat 2: bottom-left
    if (pos.bottom !== undefined && pos.left !== undefined && !pos.right) {
        return { top: -30, left: 10, right: undefined };
    }
    // Seat 9: bottom-right
    if (pos.bottom !== undefined && pos.right !== undefined && !pos.left) {
        return { top: -30, right: 10, left: undefined };
    }
    // Seat 3: left mid
    if (pos.left !== undefined && !pos.right && pos.top !== undefined && typeof pos.top === 'string' && pos.top.includes('48')) {
        return { bottom: -30, left: 10, right: undefined };
    }
    // Seat 4: upper-left
    if (pos.top !== undefined && pos.left !== undefined && !pos.right && pos.top === '18%') {
        return { top: 55, left: 10, right: undefined };
    }
    // Seat 7: upper-right
    if (pos.top !== undefined && pos.right !== undefined && !pos.left && pos.top === '18%') {
        return { top: 55, right: 10, left: undefined };
    }
    // Seat 8: right mid
    if (pos.right !== undefined && !pos.left && pos.top !== undefined && typeof pos.top === 'string' && pos.top.includes('48')) {
        return { bottom: -30, right: 10, left: undefined };
    }
    // Seat 5: top-left
    if (pos.top !== undefined && pos.top === '-2%' && pos.left !== undefined) {
        return { top: 85, left: 10, right: undefined };
    }
    // Seat 6: top-right
    if (pos.top !== undefined && pos.top === '-2%' && pos.right !== undefined) {
        return { top: 85, right: 10, left: undefined };
    }
    // Fallback
    return { top: -40, left: '50%', transform: [{ translateX: -16 }] };
}

// --- Bet chip offsets — projected onto the felt, away from board cards ---
function getBetChipOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const layout = LAYOUTS[tableSize] || LAYOUT_9;
    const pos = layout[seatIndex]?.style || {};

    // Bottom center: bet goes above seat
    if (pos.bottom !== undefined && pos.bottom === '0%') {
        return { top: -36, left: 14 };
    }
    // Bottom-left (seat 2): bet goes up-right
    if (pos.bottom !== undefined && pos.left !== undefined && !pos.right) {
        return { top: -10, right: -55 };
    }
    // Bottom-right (seat 9): bet goes up-left
    if (pos.bottom !== undefined && pos.right !== undefined && !pos.left) {
        return { top: -10, left: -55 };
    }
    // Left mid (seat 3): bet goes right, ABOVE board cards
    if (pos.left !== undefined && !pos.right && pos.top !== undefined && typeof pos.top === 'string' && pos.top.includes('48')) {
        return { top: -22, right: -60 };
    }
    // Upper-left (seat 4): bet goes down-right
    if (pos.top !== undefined && pos.left !== undefined && !pos.right && pos.top === '18%') {
        return { top: 45, right: -50 };
    }
    // Upper-right (seat 7): bet goes down-left
    if (pos.top !== undefined && pos.right !== undefined && !pos.left && pos.top === '18%') {
        return { top: 45, left: -50 };
    }
    // Right mid (seat 8): bet goes left, ABOVE board cards
    if (pos.right !== undefined && !pos.left && pos.top !== undefined && typeof pos.top === 'string' && pos.top.includes('48')) {
        return { top: -22, left: -60 };
    }
    // Top-left (seat 5): bet goes far down-right
    if (pos.top !== undefined && pos.top === '-2%' && pos.left !== undefined) {
        return { top: 80, right: -30 };
    }
    // Top-right (seat 6): bet goes far down-left
    if (pos.top !== undefined && pos.top === '-2%' && pos.right !== undefined) {
        return { top: 80, left: -30 };
    }
    // Fallback
    return { top: -36, left: 14 };
}


export const PokerTable: React.FC<PokerTableProps> = ({
    seats,
    communityCards,
    pot,
    stakes,
    tableSize,
    onPressSeat,
    onPressBoardSlot,
}) => {
    const layout = LAYOUTS[tableSize] || LAYOUT_9;

    return (
        <View style={styles.container}>
            {/* Table Felt */}
            <View style={styles.tableOuter}>
                <LinearGradient
                    colors={['#1a472a', '#0d2818']}
                    style={styles.tableFelt}
                    start={{ x: 0.3, y: 0 }}
                    end={{ x: 0.7, y: 1 }}
                >
                    {/* Stakes — absolutely positioned at top */}
                    <Text style={styles.stakesText}>{stakes}</Text>

                    {/* Community Cards — centered by flexbox */}
                    <View style={styles.communityCards}>
                        {[0, 1, 2, 3, 4].map(i => {
                            const parsed = parseCard(communityCards[i]);
                            return (
                                <TouchableOpacity
                                    key={`board-${i}`}
                                    onPress={() => onPressBoardSlot(i)}
                                    activeOpacity={0.7}
                                >
                                    <Card
                                        rank={parsed?.rank}
                                        suit={parsed?.suit}
                                        size="normal"
                                    />
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Pot — below cards */}
                    <Text style={styles.potText}>Pot: {pot}</Text>
                </LinearGradient>
            </View>

            {/* Seats */}
            <View style={styles.seatsOverlay}>
                {layout.map((seatLayout, i) => {
                    const seat = seats[i];
                    if (!seat) return null;

                    const card1 = parseCard(seat.cards[0]);
                    const card2 = parseCard(seat.cards[1]);
                    const hasCards = seat.cards.length > 0 && seat.cards.some(c => c);

                    return (
                        <TouchableOpacity
                            key={`seat-${i}`}
                            style={[styles.seat, seatLayout.style, seat.isFolded && styles.seatFolded]}
                            onPress={() => onPressSeat(i)}
                            activeOpacity={0.7}
                        >
                            {/* Hole Cards — hidden when folded */}
                            {!seat.isFolded && (
                                <View style={styles.seatCards}>
                                    {hasCards ? (
                                        <>
                                            <Card rank={card1?.rank} suit={card1?.suit} size="small" revealed />
                                            <Card rank={card2?.rank} suit={card2?.suit} size="small" revealed />
                                        </>
                                    ) : (
                                        <>
                                            <Card hidden size="small" />
                                            <Card hidden size="small" />
                                        </>
                                    )}
                                </View>
                            )}

                            {/* Seat Info Box */}
                            <View style={[
                                styles.seatInfo,
                                seat.isHero && styles.seatInfoHero,
                                seat.isActive && styles.seatInfoActive,
                            ]}>
                                <Text style={[styles.posLabel, seat.isHero && styles.posLabelHero]}>
                                    {seat.position}
                                </Text>
                                <Text style={styles.stackText}>
                                    {seat.stack.toLocaleString()}
                                </Text>
                            </View>

                            {/* Dealer Button — ♠ chip pointing inward */}
                            {seat.isDealer && (
                                <View style={[styles.dealerBtn, getDealerOffset(tableSize, i)]}>
                                    <Text style={styles.dealerText}>♠</Text>
                                </View>
                            )}

                            {/* Bet chips (SB/BB blind postings) */}
                            {seat.currentBet > 0 && (
                                <View style={[styles.betChip, getBetChipOffset(tableSize, i)]}>
                                    <Text style={styles.betChipText}>{seat.currentBet}</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        aspectRatio: 1 / 1.2,
        maxWidth: 400,
        alignSelf: 'center',
    },
    tableOuter: {
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '70%',
        height: '80%',
        borderRadius: 120,
        backgroundColor: '#1a1a1a',
        padding: 8,
        elevation: 8,
    },
    tableFelt: {
        flex: 1,
        borderRadius: 100,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
    },
    stakesText: {
        position: 'absolute',
        top: 14,
        color: 'rgba(255,255,255,0.5)',
        fontWeight: '500',
        fontSize: 9,
    },
    communityCards: {
        flexDirection: 'row',
        gap: 4,
    },
    potText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
        marginTop: 6,
    },

    // Seats overlay
    seatsOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    seat: {
        position: 'absolute',
        alignItems: 'center',
        gap: 2,
    },
    seatFolded: {
        opacity: 0.4,
    },
    seatCards: {
        flexDirection: 'row',
        gap: 2,
    },
    seatInfo: {
        backgroundColor: '#fff',
        borderRadius: 6,
        paddingVertical: 3,
        paddingHorizontal: 7,
        alignItems: 'center',
        minWidth: 48,
    },
    seatInfoHero: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 4,
        borderWidth: 2,
        borderColor: '#10b981',
    },
    seatInfoActive: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 3,
        elevation: 4,
    },
    posLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: '#333',
    },
    posLabelHero: {
        backgroundColor: '#10b981',
        color: '#000',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
        fontSize: 8,
        overflow: 'hidden',
    },
    stackText: {
        fontSize: 10,
        color: '#000',
        fontWeight: '700',
    },
    dealerBtn: {
        position: 'absolute',
        width: 32,
        height: 32,
        backgroundColor: '#111',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.3)',
    },
    dealerText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    betChip: {
        position: 'absolute',
        minWidth: 22,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        zIndex: 9,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.4)',
    },
    betChipText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
    },
});
