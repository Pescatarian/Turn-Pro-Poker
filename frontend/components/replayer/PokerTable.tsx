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

// --- Stadium-shape seat layout ---
// The table is a stadium (rectangle with semicircle caps on top and bottom).
// We distribute seats at equal arc-length intervals along this perimeter.
// Seat 0 (hero) is always at bottom center (6 o'clock).
// Seats go clockwise: seat 1 = left of hero, seat N-1 = right of hero.

type SeatPos = { style: Record<string, any> };

// Stadium geometry (in % of container)
// The seat path wraps around just outside the felt area.
// Felt is at: top=10%, left=15%, width=70%, height=80% → spans (15..85, 10..90)
// Stadium total height = 2*halfH + 2*r, total width = 2*r
// We want seats from about y=12% to y=88%, x=10% to x=90%
const STADIUM = {
    cx: 50,    // center X %
    cy: 50,    // center Y %
    halfW: 20, // half-width of straight section = r for smooth stadium
    halfH: 18, // half-height of straight section (center to where cap starts)
    r: 20,     // radius of semicircle caps (= halfW)
};

// Total perimeter of the stadium:
// Two straight sides (each 2 * halfH) + two semicircles (each π * r)
const STRAIGHT_LEN = 2 * STADIUM.halfH;
const CAP_LEN = Math.PI * STADIUM.r;
const TOTAL_PERIMETER = 2 * STRAIGHT_LEN + 2 * CAP_LEN;

// Given a distance `d` along the perimeter (starting from bottom center, going clockwise),
// return the (x, y) position in % coordinates.
// The perimeter path is: bottom-center → left straight → top-left cap → right straight → bottom-right cap
function stadiumPoint(d: number): { x: number; y: number } {
    const { cx, cy, halfW, halfH, r } = STADIUM;

    // Normalize d to [0, TOTAL_PERIMETER)
    let dist = ((d % TOTAL_PERIMETER) + TOTAL_PERIMETER) % TOTAL_PERIMETER;

    // Segment 1: Bottom-center to top along LEFT side (going up = clockwise on screen)
    // Start: (cx - halfW, cy + halfH) → End: (cx - halfW, cy - halfH)
    // But we start at bottom CENTER of the bottom cap, so first half of bottom cap, then left side...

    // Actually, let's redefine the path more carefully:
    // We have 4 segments:
    //   1. Bottom semi-cap (left half): from bottom-center going left and up to left-straight start
    //   2. Left straight: going up from (cx-halfW, cy+halfH) to (cx-halfW, cy-halfH)
    //   3. Top semi-cap: from top-left going right across the top to top-right
    //   4. Right straight: going down from (cx+halfW, cy-halfH) to (cx+halfW, cy+halfH)
    //   5. Bottom semi-cap (right half): from right-straight end going right and down to bottom-center

    // Simpler: treat it as starting at bottom center, going clockwise.
    // Path segments (clockwise from bottom center):
    const halfCap = CAP_LEN / 2; // half of one semicircle

    // Seg A: Bottom-right half of bottom cap (bottom center → left side bottom)
    //   Actually clockwise from 6 o'clock means going LEFT first.
    //   bottom center = (cx, cy + halfH + r)
    //   Going clockwise (counterclockwise in math) means left side first.

    // Let me use a cleaner model:
    // The stadium path, starting from bottom-center, going clockwise:
    //   1. Left half of bottom cap: arc from bottom-center to left-side bottom. Length = halfCap
    //   2. Left straight side: from left-bottom to left-top. Length = STRAIGHT_LEN  
    //   3. Top cap: arc from left-top to right-top. Length = CAP_LEN
    //   4. Right straight side: from right-top to right-bottom. Length = STRAIGHT_LEN
    //   5. Right half of bottom cap: arc from right-bottom to bottom-center. Length = halfCap

    const seg1 = halfCap;                           // left half of bottom cap
    const seg2 = seg1 + STRAIGHT_LEN;               // left straight
    const seg3 = seg2 + CAP_LEN;                    // top cap
    const seg4 = seg3 + STRAIGHT_LEN;               // right straight
    // seg5 ends at TOTAL_PERIMETER                  // right half of bottom cap

    if (dist < seg1) {
        // Left half of bottom cap: arc from bottom-center going left
        // Center of bottom cap: (cx, cy + halfH)
        // Arc goes from angle π/2 (pointing down) to angle π (pointing left)
        const t = dist / halfCap; // 0..1
        const angle = (Math.PI / 2) + t * (Math.PI / 2); // π/2 to π
        return {
            x: cx + r * Math.cos(angle),
            y: (cy + halfH) + r * Math.sin(angle),
        };
    } else if (dist < seg2) {
        // Left straight: going up from (cx - halfW, cy + halfH) to (cx - halfW, cy - halfH)
        const t = (dist - seg1) / STRAIGHT_LEN;
        return {
            x: cx - halfW,
            y: (cy + halfH) - t * (2 * halfH),
        };
    } else if (dist < seg3) {
        // Top cap: arc from left-top to right-top
        // Center of top cap: (cx, cy - halfH)
        // Arc goes from angle π (pointing left) to angle 0/2π (pointing right), going through 3π/2 (up)
        const t = (dist - seg2) / CAP_LEN;
        const angle = Math.PI + t * Math.PI; // π to 2π
        return {
            x: cx + r * Math.cos(angle),
            y: (cy - halfH) + r * Math.sin(angle),
        };
    } else if (dist < seg4) {
        // Right straight: going down from (cx + halfW, cy - halfH) to (cx + halfW, cy + halfH)
        const t = (dist - seg3) / STRAIGHT_LEN;
        return {
            x: cx + halfW,
            y: (cy - halfH) + t * (2 * halfH),
        };
    } else {
        // Right half of bottom cap: arc from right-bottom back to bottom-center
        // Center of bottom cap: (cx, cy + halfH)
        // Arc goes from angle 0 (pointing right) to angle π/2 (pointing down)
        const t = (dist - seg4) / halfCap;
        const angle = t * (Math.PI / 2); // 0 to π/2
        return {
            x: cx + r * Math.cos(angle),
            y: (cy + halfH) + r * Math.sin(angle),
        };
    }
}

function computeSeatLayout(tableSize: number): SeatPos[] {
    const spacing = TOTAL_PERIMETER / tableSize;
    const seats: SeatPos[] = [];

    for (let i = 0; i < tableSize; i++) {
        const d = i * spacing;
        const { x, y } = stadiumPoint(d);

        seats.push({
            style: {
                left: `${x.toFixed(1)}%`,
                top: `${y.toFixed(1)}%`,
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

// Dealer button offset — points toward table center from the seat position.
function getDealerOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const spacing = TOTAL_PERIMETER / tableSize;
    const { x, y } = stadiumPoint(seatIndex * spacing);
    // Direction from seat toward center
    const dx = STADIUM.cx - x;
    const dy = STADIUM.cy - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dist = 38;
    return {
        left: 14 + Math.round((dx / len) * dist),
        top: 20 + Math.round((dy / len) * dist),
    };
}

// Bet chip offset — placed between seat and table center.
function getBetChipOffset(tableSize: number, seatIndex: number): Record<string, any> {
    const spacing = TOTAL_PERIMETER / tableSize;
    const { x, y } = stadiumPoint(seatIndex * spacing);
    const dx = STADIUM.cx - x;
    const dy = STADIUM.cy - y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const dist = 50;
    return {
        left: 20 + Math.round((dx / len) * dist),
        top: 25 + Math.round((dy / len) * dist),
    };
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
