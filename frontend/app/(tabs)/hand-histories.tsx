import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { GlassCard } from '../../components/ui/GlassCard';
import { PokerTable } from '../../components/replayer/PokerTable';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useReplayer, HandData, Player, GameAction } from '../../hooks/useReplayer';
import { withObservables } from '@nozbe/watermelondb/react';
import { database } from '../../model';
import Hand from '../../model/Hand';
import { Q } from '@nozbe/watermelondb';

const { width } = Dimensions.get('window');

// Helper to transform WatermelonDB Hand model to Replayer HandData
const transformHandToReplayerData = (hand: Hand): HandData => {
    // Default 6-max table
    const players: Player[] = Array.from({ length: 9 }, (_, i) => ({
        id: i + 1,
        name: i === 0 ? 'Hero' : `P${i + 1}`,
        stack: 100, // Default stack
        isActive: false,
        isDealer: false,
    }));

    // Activate Hero
    players[0].isActive = true;
    players[0].cards = hand.cards || [];

    // Parse actions to activate other players
    const actions: GameAction[] = hand.actions || [];
    const activePlayerIds = new Set<number>();
    activePlayerIds.add(1); // Hero always active

    actions.forEach(action => {
        if (action.playerId) {
            activePlayerIds.add(action.playerId);
            if (players[action.playerId - 1]) {
                players[action.playerId - 1].isActive = true;
            }
        }
    });

    return {
        id: hand.id,
        stakes: '', // Needs session data join, skipping for now
        date: new Date(hand.createdAt).toISOString(),
        winners: [],
        communityCards: hand.communityCards || [],
        players,
        actions,
    };
};

const HandItem = ({ hand, onPress }: { hand: Hand, onPress: (hand: Hand) => void }) => {
    const date = new Date(hand.createdAt).toLocaleDateString();

    // Quick summary logic
    const heroCards = hand.cards && hand.cards.length === 2
        ? `${hand.cards[0].rank}${hand.cards[0].suit} ${hand.cards[1].rank}${hand.cards[1].suit}`
        : 'No Cards';

    return (
        <TouchableOpacity onPress={() => onPress(hand)}>
            <GlassCard style={styles.handCard} intensity={20}>
                <View style={styles.handHeader}>
                    <Text style={styles.handDate}>{date}</Text>
                    <Text style={styles.potSize}>Pot: ${hand.pot}</Text>
                </View>
                <View style={styles.handBody}>
                    <Text style={styles.heroCards}>{heroCards}</Text>
                    {hand.notes ? <Text style={styles.note} numberOfLines={1}>{hand.notes}</Text> : null}
                </View>
            </GlassCard>
        </TouchableOpacity>
    );
};


const HandHistoriesScreen = ({ hands }: { hands: Hand[] }) => {
    const [replayerVisible, setReplayerVisible] = useState(false);
    const [selectedHand, setSelectedHand] = useState<HandData | null>(null);

    // Initialize Replayer Hook
    const { gameState, controls } = useReplayer(selectedHand);

    const handlePressHand = (hand: Hand) => {
        const handData = transformHandToReplayerData(hand);
        setSelectedHand(handData);
        setReplayerVisible(true);
    };

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>Hand Histories</Text>
                    {/* Add Hand Button - Placeholder or navigate to manual entry */}
                    {/* For now, just a visual indicator or maybe hidden */}
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {hands.length === 0 ? (
                        <View style={styles.emptyState}>
                            <GlassCard style={styles.emptyCard} intensity={10}>
                                <Ionicons name="albums-outline" size={48} color={COLORS.muted} style={{ marginBottom: 12, opacity: 0.5 }} />
                                <Text style={styles.emptyTitle}>No hands recorded</Text>
                            </GlassCard>
                        </View>
                    ) : (
                        hands.map((item: Hand) => (
                            <HandItem key={item.id} hand={item} onPress={handlePressHand} />
                        ))
                    )}
                </ScrollView>

                {/* Replayer Modal */}
                <Modal
                    visible={replayerVisible}
                    animationType="slide"
                    presentationStyle="fullScreen"
                    onRequestClose={() => setReplayerVisible(false)}
                >
                    <ScreenWrapper style={{ paddingTop: 0 }}>
                        <View style={styles.replayerHeader}>
                            <TouchableOpacity onPress={() => setReplayerVisible(false)} style={styles.backBtn}>
                                <Ionicons name="arrow-back" size={24} color="#fff" />
                            </TouchableOpacity>
                            <Text style={styles.replayerTitle}>Replay</Text>
                            <View style={{ width: 40 }} />
                        </View>

                        <View style={styles.replayerBody}>
                            <PokerTable
                                players={gameState.players}
                                communityCards={gameState.board as any}
                                pot={gameState.pot}
                            />
                        </View>

                        <GlassCard style={styles.controls} intensity={40}>
                            <View style={styles.controlRow}>
                                <TouchableOpacity onPress={controls.prevAction} disabled={!controls.canPrev}>
                                    <Ionicons name="play-skip-back" size={24} color={controls.canPrev ? COLORS.text : COLORS.muted} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={controls.togglePlay}>
                                    <Ionicons name={controls.isPlaying ? "pause-circle" : "play-circle"} size={48} color={COLORS.accent} />
                                </TouchableOpacity>

                                <TouchableOpacity onPress={controls.nextAction} disabled={!controls.canNext}>
                                    <Ionicons name="play-skip-forward" size={24} color={controls.canNext ? COLORS.text : COLORS.muted} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.streetLabel}>{gameState.currentStreet.toUpperCase()}</Text>
                        </GlassCard>
                    </ScreenWrapper>
                </Modal>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginBottom: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.text,
    },
    listContent: {
        paddingBottom: 80,
    },
    handCard: {
        marginBottom: 10,
        padding: 15,
        borderRadius: 12,
    },
    handHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    handDate: {
        color: COLORS.muted,
        fontSize: 12,
    },
    potSize: {
        color: COLORS.accent,
        fontWeight: 'bold',
        fontSize: 14,
    },
    handBody: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    heroCards: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16,
    },
    note: {
        color: COLORS.muted,
        fontSize: 12,
        maxWidth: '60%',
    },
    emptyState: {
        marginTop: 40,
    },
    emptyCard: {
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        color: COLORS.text,
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 4,
    },
    replayerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    replayerTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    backBtn: {
        padding: 8,
    },
    replayerBody: {
        flex: 1,
        justifyContent: 'center',
    },
    controls: {
        margin: 16,
        padding: 20,
        alignItems: 'center',
    },
    controlRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 32,
        marginBottom: 10,
    },
    streetLabel: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: 'bold',
        letterSpacing: 1,
    }
});

const enhance = withObservables([], () => ({
    hands: database.collections.get('hands').query(Q.sortBy('created_at', Q.desc)),
}));

export default enhance(HandHistoriesScreen);
