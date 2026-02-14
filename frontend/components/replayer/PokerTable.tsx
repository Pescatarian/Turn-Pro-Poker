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
    showCards?: boolean;
    displayMode?: 'money' | 'bb';
    bb?: number;
}

function parseCard(c: string): { rank: string; suit: 'h' | 'd' | 'c' | 's' } | null {
    if (!c || c.length < 2) return null;
    return { rank: c.slice(0, -1), suit: c.slice(-1) as any };
}

// --- Seat Layout Definitions ---
// Each entry: { style } for absolute positioning within the container.
// Seat 0 = Hero = always at 6 o'clock (bottom center).
// Remaining seats are evenly distributed clockwise around the perimeter.

type SeatPos = { style: Record<string, any> };

// --- 9-max: Hero at 6, then every 40° clockwise ---
const LAYOUT_9: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00 (hero)
    { style: { bottom: '12%', left: '0%' } },                                          // 1: ~7:20
    { style: { top: '38%', left: '-4%', transform: [{ translateY: -30 }] } },          // 2: ~8:40
    { style: { top: '10%', left: '2%' } },                                             // 3: ~10:00
    { style: { top: '-4%', left: '22%' } },                                            // 4: ~11:20
    { style: { top: '-4%', right: '22%' } },                                           // 5: ~12:40
    { style: { top: '10%', right: '2%' } },                                            // 6: ~2:00
    { style: { top: '38%', right: '-4%', transform: [{ translateY: -30 }] } },         // 7: ~3:20
    { style: { bottom: '12%', right: '0%' } },                                         // 8: ~4:40
];

// --- 8-max: Hero at 6, then every 45° clockwise ---
const LAYOUT_8: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { bottom: '14%', left: '0%' } },                                          // 1: ~7:30
    { style: { top: '28%', left: '-2%', transform: [{ translateY: -30 }] } },          // 2: ~9:00
    { style: { top: '2%', left: '12%' } },                                             // 3: ~10:30
    { style: { top: '-4%', left: '50%', transform: [{ translateX: -35 }] } },          // 4: 12:00
    { style: { top: '2%', right: '12%' } },                                            // 5: ~1:30
    { style: { top: '28%', right: '-2%', transform: [{ translateY: -30 }] } },         // 6: ~3:00
    { style: { bottom: '14%', right: '0%' } },                                         // 7: ~4:30
];

// --- 7-max: Hero at 6, ~51° spacing ---
const LAYOUT_7: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { bottom: '10%', left: '0%' } },                                          // 1: ~7:43
    { style: { top: '16%', left: '-2%' } },                                            // 2: ~9:26
    { style: { top: '-4%', left: '24%' } },                                            // 3: ~11:09
    { style: { top: '-4%', right: '24%' } },                                           // 4: ~12:51
    { style: { top: '16%', right: '-2%' } },                                           // 5: ~2:34
    { style: { bottom: '10%', right: '0%' } },                                         // 6: ~4:17
];

// --- 6-max: Hero at 6, every 60° ---
const LAYOUT_6: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { bottom: '10%', left: '0%' } },                                          // 1: ~8:00
    { style: { top: '6%', left: '2%' } },                                              // 2: 10:00
    { style: { top: '-4%', left: '50%', transform: [{ translateX: -35 }] } },          // 3: 12:00
    { style: { top: '6%', right: '2%' } },                                             // 4: 2:00
    { style: { bottom: '10%', right: '0%' } },                                         // 5: ~4:00
];

// --- 5-max: Hero at 6, every 72° ---
const LAYOUT_5: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { top: '30%', left: '-2%', transform: [{ translateY: -30 }] } },          // 1: ~8:24
    { style: { top: '-2%', left: '16%' } },                                            // 2: ~10:48
    { style: { top: '-2%', right: '16%' } },                                           // 3: ~1:12
    { style: { top: '30%', right: '-2%', transform: [{ translateY: -30 }] } },         // 4: ~3:36
];

// --- 4-max: Hero at 6, every 90° ---
const LAYOUT_4: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { top: '32%', left: '-4%', transform: [{ translateY: -30 }] } },          // 1: 9:00
    { style: { top: '-4%', left: '50%', transform: [{ translateX: -35 }] } },          // 2: 12:00
    { style: { top: '32%', right: '-4%', transform: [{ translateY: -30 }] } },         // 3: 3:00
];

// --- 3-max: Hero at 6, every 120° ---
const LAYOUT_3: SeatPos[] = [
    { style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },       // 0: 6:00
    { style: { top: '6%', left: '2%' } },                                              // 1: 10:00
    { style: { top: '6%', right: '2%' } },                                             // 2: 2:00
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

// Dealer button offset — positioned relative to the seat anchor.
// Uses seat index directly for robustness (independent of seat CSS positions).
function getDealerOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const layout = LAYOUTS[tableSize] || LAYOUT_9;
    const pos = layout[seatIndex]?.style || {};

    // Bottom center (hero): dealer floats above
    if (seatIndex === 0) {
        return { top: -40, left: '50%', transform: [{ translateX: -16 }] };
    }
    // Left side seats: dealer goes to the right
    if (pos.left !== undefined && !pos.right) {
        return { top: 0, left: '100%', marginLeft: 26 };
    }
    // Right side seats: dealer goes to the left
    if (pos.right !== undefined && !pos.left) {
        return { bottom: 20, right: '100%', marginRight: 26 };
    }
    // Top center: dealer below
    if (pos.left === '50%' || pos.right === '50%') {
        return { bottom: -40, left: '50%', transform: [{ translateX: -16 }] };
    }
    return { top: -40, left: '50%', transform: [{ translateX: -16 }] };
}

// --- Bet chip offsets — projected onto the felt, away from board cards ---
function getBetChipOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const layout = LAYOUTS[tableSize] || LAYOUT_9;
    const pos = layout[seatIndex]?.style || {};

    // Bottom center (hero): bet goes above seat
    if (seatIndex === 0) {
        return { top: -36, left: 14 };
    }

    // Determine which side the seat is on
    const isLeft = pos.left !== undefined && !pos.right;
    const isRight = pos.right !== undefined && !pos.left;
    const isTop = pos.top !== undefined && pos.bottom === undefined;
    const isBottom = pos.bottom !== undefined && pos.bottom !== '0%';

    // Bottom-left: bet goes up-right
    if (isBottom && isLeft) return { top: -10, right: -55 };
    // Bottom-right: bet goes up-left
    if (isBottom && isRight) return { top: -10, left: -55 };

    // Mid-left: bet goes right
    if (isLeft && isTop && parseFloat(pos.top) > 20) return { top: -22, right: -55 };
    // Mid-right: bet goes left
    if (isRight && isTop && parseFloat(pos.top) > 20) return { top: -22, left: -55 };

    // Upper-left: bet goes down-right
    if (isLeft && isTop && parseFloat(pos.top) <= 20) return { top: 50, right: -40 };
    // Upper-right: bet goes down-left
    if (isRight && isTop && parseFloat(pos.top) <= 20) return { top: 50, left: -40 };

    // Top center: bet goes below
    if (pos.left === '50%' && isTop) return { bottom: -30, left: 14 };

    // Fallback
    return { top: -36, left: 14 };
}


// Format an amount based on display mode
function formatAmount(amount: number, displayMode: 'money' | 'bb', bb: number): string {
    if (displayMode === 'bb') {
        const bbs = amount / bb;
        // Show decimals only if not a whole number
        return bbs % 1 === 0 ? `${bbs}bb` : `${bbs.toFixed(1)}bb`;
    }
    return amount.toLocaleString();
}

export const PokerTable: React.FC<PokerTableProps> = ({
    seats,
    communityCards,
    pot,
    stakes,
    tableSize,
    onPressSeat,
    onPressBoardSlot,
    showCards = true,
    displayMode = 'money',
    bb = 10,
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
                    <Text style={styles.potText}>Pot: {formatAmount(pot, displayMode, bb)}</Text>
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
                                        showCards || seat.isHero ? (
                                            <>
                                                <Card rank={card1?.rank} suit={card1?.suit} size="small" revealed />
                                                <Card rank={card2?.rank} suit={card2?.suit} size="small" revealed />
                                            </>
                                        ) : (
                                            <>
                                                <Card hidden size="small" />
                                                <Card hidden size="small" />
                                            </>
                                        )
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
                                    {formatAmount(seat.stack, displayMode, bb)}
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
                                <View style={[styles.betChipContainer, getBetChipOffset(tableSize, i)]}>
                                    <View style={styles.betChipCircle}>
                                        <View style={styles.betChipInnerRing} />
                                    </View>
                                    <Text style={styles.betChipAmount}>
                                        {formatAmount(seat.currentBet, displayMode, bb)}
                                    </Text>
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
    betChipContainer: {
        position: 'absolute',
        alignItems: 'center',
        zIndex: 9,
    },
    betChipCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#c0392b',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#e74c3c',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.4,
        shadowRadius: 2,
        elevation: 3,
    },
    betChipInnerRing: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.5)',
        borderStyle: 'dashed',
    },
    betChipAmount: {
        fontSize: 9,
        fontWeight: '800',
        color: '#fff',
        marginTop: 1,
        textShadowColor: 'rgba(0,0,0,0.8)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
});
