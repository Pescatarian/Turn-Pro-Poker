import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Card } from './Card';

/*
  Seat positions matching index.html exactly:
  .seat-1{bottom:0%;left:50%;transform:translateX(-50%)}         BTN
  .seat-2{bottom:18%;left:5%}                                     SB
  .seat-3{top:50%;left:0%;transform:translateY(-50%)}             BB
  .seat-4{top:20%;left:3%}                                        UTG
  .seat-5{top:0%;left:25%;transform:translateX(-50%)}             EP
  .seat-6{top:0%;right:25%;transform:translateX(50%)}             MP
  .seat-7{top:20%;right:3%}                                       LJ
  .seat-8{top:50%;right:0%;transform:translateY(-50%)}            HJ
  .seat-9{bottom:18%;right:5%}                                    CO
*/

const POSITIONS = ['BTN', 'SB', 'BB', 'UTG', 'EP', 'MP', 'LJ', 'HJ', 'CO'];

const SEAT_LAYOUT: { id: number; style: any }[] = [
    { id: 1, style: { bottom: '0%', left: '50%', transform: [{ translateX: -35 }] } },
    { id: 2, style: { bottom: '18%', left: '2%' } },
    { id: 3, style: { top: '48%', left: '-2%', transform: [{ translateY: -30 }] } },
    { id: 4, style: { top: '18%', left: '2%' } },
    { id: 5, style: { top: '-2%', left: '22%', transform: [{ translateX: -20 }] } },
    { id: 6, style: { top: '-2%', right: '22%', transform: [{ translateX: 20 }] } },
    { id: 7, style: { top: '18%', right: '2%' } },
    { id: 8, style: { top: '48%', right: '-2%', transform: [{ translateY: -30 }] } },
    { id: 9, style: { bottom: '18%', right: '2%' } },
];

export interface SeatData {
    position: string;
    stack: number;
    cards: string[]; // e.g. ['Ah', 'Kd']
    isHero: boolean;
    isDealer: boolean;
    isFolded: boolean;
    isActive: boolean;
}

interface PokerTableProps {
    seats: SeatData[];
    communityCards: string[]; // e.g. ['Ah', '2c', 'Td', '', '']
    pot: number;
    stakes: string;
    onPressSeat: (seatIndex: number) => void;
    onPressBoardSlot: (slotIndex: number) => void;
}

function parseCard(c: string): { rank: string; suit: 'h' | 'd' | 'c' | 's' } | null {
    if (!c || c.length < 2) return null;
    return { rank: c.slice(0, -1), suit: c.slice(-1) as any };
}

export const PokerTable: React.FC<PokerTableProps> = ({
    seats,
    communityCards,
    pot,
    stakes,
    onPressSeat,
    onPressBoardSlot,
}) => {
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
                    {/* Stakes */}
                    <Text style={styles.stakesText}>{stakes}</Text>

                    {/* Community Cards */}
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

                    {/* Pot */}
                    <View style={styles.potRow}>
                        <Text style={styles.potChips}>●●●</Text>
                        <Text style={styles.potText}>{pot}</Text>
                    </View>
                </LinearGradient>
            </View>

            {/* Seats */}
            <View style={styles.seatsOverlay}>
                {SEAT_LAYOUT.map((layout, i) => {
                    const seat = seats[i];
                    if (!seat) return null;

                    const card1 = parseCard(seat.cards[0]);
                    const card2 = parseCard(seat.cards[1]);
                    const hasCards = seat.cards.length > 0 && seat.cards.some(c => c);

                    return (
                        <TouchableOpacity
                            key={layout.id}
                            style={[styles.seat, layout.style, seat.isFolded && styles.seatFolded]}
                            onPress={() => onPressSeat(i)}
                            activeOpacity={0.7}
                        >
                            {/* Hole Cards */}
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

                            {/* Dealer Button */}
                            {seat.isDealer && (
                                <View style={styles.dealerBtn}>
                                    <Text style={styles.dealerText}>D</Text>
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
        aspectRatio: 1 / 1.4,
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
        // Outer shadow matching index.html: box-shadow: 0 0 0 8px #1a1a1a
        elevation: 8,
    },
    tableFelt: {
        flex: 1,
        borderRadius: 110,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    stakesText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 11,
        marginBottom: 4,
    },
    communityCards: {
        flexDirection: 'row',
        gap: 4,
    },
    potRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 4,
    },
    potChips: {
        color: '#ef4444',
        fontSize: 8,
        letterSpacing: -2,
    },
    potText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 11,
    },

    // Seats overlay
    seatsOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    seat: {
        position: 'absolute',
        alignItems: 'center',
        gap: 4,
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
        borderRadius: 8,
        paddingVertical: 6,
        paddingHorizontal: 10,
        alignItems: 'center',
        minWidth: 55,
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
        fontSize: 11,
        fontWeight: '600',
        color: '#333',
    },
    posLabelHero: {
        backgroundColor: '#10b981',
        color: '#000',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontSize: 9,
        overflow: 'hidden',
    },
    stackText: {
        fontSize: 12,
        color: '#000',
        fontWeight: '700',
    },
    dealerBtn: {
        position: 'absolute',
        top: 30,
        right: -8,
        width: 24,
        height: 24,
        backgroundColor: '#fff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
    },
    dealerText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
    },
});
