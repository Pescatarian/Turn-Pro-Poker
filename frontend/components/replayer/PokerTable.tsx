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

// --- Computed Seat Positions ---
// Seats are placed on an elliptical path using trigonometry.
// Hero (seat 0) is always at 6 o'clock (bottom center).
// Remaining seats are evenly distributed clockwise.

type SeatPos = { style: Record<string, any> };

// --- Per-seat nudge offsets (in %) ---
// Adjust individual seats per table size without changing the elliptical model.
// dx = shift right (+) or left (-), dy = shift down (+) or up (-)
const SEAT_NUDGE: Record<number, { dx: number; dy: number }[]> = {
    3: [
        { dx: 0, dy: 0 },  // seat 0 (hero, 6 o'clock)
        { dx: 0, dy: 0 },  // seat 1
        { dx: 0, dy: 0 },  // seat 2
    ],
    4: [
        { dx: 0, dy: 0 },  // seat 0 (hero)
        { dx: 0, dy: 0 },  // seat 1
        { dx: 0, dy: 0 },  // seat 2
        { dx: 0, dy: 0 },  // seat 3
    ],
    5: [
        { dx: 0, dy: 0 },  // seat 0 (hero)
        { dx: 0, dy: 0 },  // seat 1
        { dx: 0, dy: 0 },  // seat 2
        { dx: 0, dy: 0 },  // seat 3
        { dx: 0, dy: 0 },  // seat 4
    ],
    6: [
        { dx: 0, dy: 0 },  // seat 0 (hero, 6 o'clock)
        { dx: 0, dy: 0 },  // seat 1 (~8 o'clock)
        { dx: 0, dy: 0 },  // seat 2 (~10 o'clock)
        { dx: 0, dy: 0 },  // seat 3 (12 o'clock)
        { dx: 0, dy: 0 },  // seat 4 (~2 o'clock)
        { dx: 0, dy: 0 },  // seat 5 (~4 o'clock)
    ],
    7: [
        { dx: 0, dy: 0 },  // seat 0 (hero)
        { dx: 0, dy: 0 },  // seat 1
        { dx: 0, dy: 0 },  // seat 2
        { dx: 0, dy: 0 },  // seat 3
        { dx: 0, dy: 0 },  // seat 4
        { dx: 0, dy: 0 },  // seat 5
        { dx: 0, dy: 0 },  // seat 6
    ],
    8: [
        { dx: 0, dy: 0 },  // seat 0 (hero)
        { dx: 0, dy: 0 },  // seat 1
        { dx: 0, dy: 0 },  // seat 2
        { dx: 0, dy: 0 },  // seat 3
        { dx: 0, dy: 0 },  // seat 4
        { dx: 0, dy: 0 },  // seat 5
        { dx: 0, dy: 0 },  // seat 6
        { dx: 0, dy: 0 },  // seat 7
    ],
    9: [
        { dx: 0, dy: 0 },   // seat 0 (hero, 6 o'clock)
        { dx: -6, dy: 0 },  // seat 1 → seat 2 (~7:30) → left
        { dx: 0, dy: 0 },   // seat 2 → seat 3 (~9 o'clock)
        { dx: -4.75, dy: 0 }, // seat 3 → seat 4 (~10:30) → X aligned with seat 3
        { dx: -3, dy: -3 }, // seat 4 → seat 5 (~11 o'clock) → left + up
        { dx: 3, dy: -3 },  // seat 5 → seat 6 (~1 o'clock) → right + up
        { dx: 4.75, dy: 0 },  // seat 6 → seat 7 (~1:30) → X aligned with seat 8
        { dx: 0, dy: 0 },   // seat 7 → seat 8 (~3 o'clock)
        { dx: 6, dy: 0 },   // seat 8 → seat 9 (~4:30) → right
    ],
};

// Compute seat angle for a given seat index and table size.
// Returns angle in radians. 6 o'clock = π/2 in screen coords (y-down).
// Clockwise = increasing angle: 6→9→12→3.
function seatAngle(tableSize: number, seatIndex: number): number {
    return (Math.PI / 2) + (seatIndex * 2 * Math.PI / tableSize);
}

// Compute seat positions on an elliptical path + per-seat nudge.
function computeSeatLayout(tableSize: number): SeatPos[] {
    const cx = 50;   // center X %
    const cy = 50;   // center Y %
    const rx = 40;   // horizontal semi-axis %
    const ry = 40;   // vertical semi-axis %
    const nudges = SEAT_NUDGE[tableSize] || [];

    const seats: SeatPos[] = [];
    for (let i = 0; i < tableSize; i++) {
        const angle = seatAngle(tableSize, i);
        const nudge = nudges[i] || { dx: 0, dy: 0 };
        const xPct = cx + rx * Math.cos(angle) + nudge.dx;
        const yPct = cy + ry * Math.sin(angle) + nudge.dy;

        seats.push({
            style: {
                left: `${xPct.toFixed(1)}%`,
                top: `${yPct.toFixed(1)}%`,
                transform: [{ translateX: -30 }, { translateY: -35 }],
            },
        });
    }
    return seats;
}

const LAYOUTS: Record<number, SeatPos[]> = {};
for (let n = 3; n <= 9; n++) {
    LAYOUTS[n] = computeSeatLayout(n);
}

// Dealer button offset — uses angle to point toward table center.
function getDealerOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const angle = seatAngle(tableSize, seatIndex);
    const dist = 38;
    // Offset toward center (opposite direction of seat's position on ellipse)
    const dx = Math.round(-dist * Math.cos(angle));
    const dy = Math.round(-dist * Math.sin(angle));
    // Position relative to seat layout box (center is approx 30, 35)
    return { left: 14 + dx, top: 20 + dy };
}

// Bet chip offset — placed between seat and table center, further out than dealer.
function getBetChipOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const angle = seatAngle(tableSize, seatIndex);
    const dist = 50;
    const dx = Math.round(-dist * Math.cos(angle));
    const dy = Math.round(-dist * Math.sin(angle));
    return { left: 20 + dx, top: 25 + dy };
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
    const layout = LAYOUTS[tableSize] || computeSeatLayout(9);

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
        flex: 1,
        maxWidth: 420,
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
