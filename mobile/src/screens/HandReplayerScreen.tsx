import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { generateUUID } from '../utils/uuid';

const SUITS = ['♠', '♥', '♦', '♣'];
const RANKS = ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'];

interface Action {
  id: string;
  player: number;
  type: 'fold' | 'check' | 'call' | 'bet' | 'raise';
  amount?: number;
  street: string;
}

export function HandReplayerScreen() {
  const [pot, setPot] = useState(0);
  const [street, setStreet] = useState<'preflop' | 'flop' | 'turn' | 'river'>('preflop');
  const [heroCards, setHeroCards] = useState<string[]>([]);
  const [communityCards, setCommunityCards] = useState<string[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [betAmount, setBetAmount] = useState('');
  const [showCardPicker, setShowCardPicker] = useState(false);
  const [cardPickerTarget, setCardPickerTarget] = useState<'hero' | 'community'>('hero');
  const [notes, setNotes] = useState('');

  // 9 seat positions around the table
  const seatPositions = [
    { id: 1, label: 'BTN', angle: 0 },
    { id: 2, label: 'SB', angle: 40 },
    { id: 3, label: 'BB', angle: 80 },
    { id: 4, label: 'UTG', angle: 120 },
    { id: 5, label: 'UTG+1', angle: 160 },
    { id: 6, label: 'MP', angle: 200 },
    { id: 7, label: 'MP+1', angle: 240 },
    { id: 8, label: 'CO-1', angle: 280 },
    { id: 9, label: 'CO', angle: 320 },
  ];

  const getSeatStyle = (angle: number) => {
    const radius = 120;
    const centerX = 150;
    const centerY = 120;
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      left: centerX + radius * Math.cos(radian) - 25,
      top: centerY + radius * Math.sin(radian) - 25,
    };
  };

  const addAction = (type: 'fold' | 'check' | 'call' | 'bet' | 'raise') => {
    if (selectedSeat === null) return;

    const action: Action = {
      id: generateUUID(),
      player: selectedSeat,
      type,
      street,
    };

    if ((type === 'bet' || type === 'raise') && betAmount) {
      action.amount = parseFloat(betAmount);
      setPot(prev => prev + action.amount!);
    } else if (type === 'call') {
      // Simplified: assume call amount from last bet
      const lastBet = actions.filter(a => a.amount).pop();
      if (lastBet?.amount) {
        action.amount = lastBet.amount;
        setPot(prev => prev + lastBet.amount!);
      }
    }

    setActions([...actions, action]);
    setBetAmount('');
  };

  const advanceStreet = () => {
    const streets: ('preflop' | 'flop' | 'turn' | 'river')[] = ['preflop', 'flop', 'turn', 'river'];
    const currentIndex = streets.indexOf(street);
    if (currentIndex < streets.length - 1) {
      setStreet(streets[currentIndex + 1]);
    }
  };

  const selectCard = (card: string) => {
    if (cardPickerTarget === 'hero') {
      if (heroCards.length < 2 && !heroCards.includes(card)) {
        setHeroCards([...heroCards, card]);
      }
    } else {
      const maxCards = street === 'flop' ? 3 : street === 'turn' ? 4 : 5;
      if (communityCards.length < maxCards && !communityCards.includes(card) && !heroCards.includes(card)) {
        setCommunityCards([...communityCards, card]);
      }
    }
  };

  const resetHand = () => {
    setPot(0);
    setStreet('preflop');
    setHeroCards([]);
    setCommunityCards([]);
    setActions([]);
    setSelectedSeat(null);
    setBetAmount('');
    setNotes('');
  };

  const saveHand = () => {
    // TODO: Save to Redux store and sync
    console.log('Saving hand:', {
      pot,
      street,
      heroCards,
      communityCards,
      actions,
      notes,
    });
    resetHand();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Hand Replayer</Text>

        {/* Poker Table */}
        <View style={styles.tableContainer}>
          <View style={styles.table}>
            {/* Community Cards */}
            <View style={styles.communityArea}>
              <Text style={styles.potText}>Pot: ${pot}</Text>
              <View style={styles.communityCards}>
                {communityCards.map((card, i) => (
                  <View key={i} style={styles.communityCard}>
                    <Text style={[
                      styles.cardText,
                      (card.includes('♥') || card.includes('♦')) && styles.redCard
                    ]}>{card}</Text>
                  </View>
                ))}
                {communityCards.length < 5 && (
                  <TouchableOpacity
                    style={styles.addCardButton}
                    onPress={() => {
                      setCardPickerTarget('community');
                      setShowCardPicker(true);
                    }}
                  >
                    <Text style={styles.addCardText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.streetText}>{street.toUpperCase()}</Text>
            </View>

            {/* Seats */}
            {seatPositions.map(seat => (
              <TouchableOpacity
                key={seat.id}
                style={[
                  styles.seat,
                  getSeatStyle(seat.angle),
                  selectedSeat === seat.id && styles.selectedSeat,
                  seat.id === 1 && styles.heroSeat,
                ]}
                onPress={() => setSelectedSeat(seat.id)}
              >
                <Text style={styles.seatLabel}>{seat.label}</Text>
                <Text style={styles.seatNumber}>P{seat.id}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Hero Cards */}
        <View style={styles.heroSection}>
          <Text style={styles.sectionLabel}>Your Cards</Text>
          <View style={styles.heroCards}>
            {heroCards.map((card, i) => (
              <View key={i} style={styles.heroCard}>
                <Text style={[
                  styles.heroCardText,
                  (card.includes('♥') || card.includes('♦')) && styles.redCard
                ]}>{card}</Text>
              </View>
            ))}
            {heroCards.length < 2 && (
              <TouchableOpacity
                style={styles.addHeroCard}
                onPress={() => {
                  setCardPickerTarget('hero');
                  setShowCardPicker(true);
                }}
              >
                <Text style={styles.addCardText}>+</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Actions {selectedSeat ? `(P${selectedSeat})` : '(Select seat)'}</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.foldButton]}
              onPress={() => addAction('fold')}
              disabled={!selectedSeat}
            >
              <Text style={styles.actionButtonText}>Fold</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.checkButton]}
              onPress={() => addAction('check')}
              disabled={!selectedSeat}
            >
              <Text style={styles.actionButtonText}>Check</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.callButton]}
              onPress={() => addAction('call')}
              disabled={!selectedSeat}
            >
              <Text style={styles.actionButtonText}>Call</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.betRow}>
            <TextInput
              style={styles.betInput}
              value={betAmount}
              onChangeText={setBetAmount}
              placeholder="Amount"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              style={[styles.actionButton, styles.betButton]}
              onPress={() => addAction('bet')}
              disabled={!selectedSeat || !betAmount}
            >
              <Text style={styles.actionButtonText}>Bet</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.raiseButton]}
              onPress={() => addAction('raise')}
              disabled={!selectedSeat || !betAmount}
            >
              <Text style={styles.actionButtonText}>Raise</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Street Control */}
        <View style={styles.streetControl}>
          <TouchableOpacity style={styles.streetButton} onPress={advanceStreet}>
            <Text style={styles.streetButtonText}>Next Street →</Text>
          </TouchableOpacity>
        </View>

        {/* Action History */}
        <View style={styles.historySection}>
          <Text style={styles.sectionLabel}>Action History</Text>
          <View style={styles.historyList}>
            {actions.length === 0 ? (
              <Text style={styles.emptyHistory}>No actions yet</Text>
            ) : (
              actions.map((action, i) => (
                <View key={action.id} style={styles.historyItem}>
                  <Text style={styles.historyText}>
                    [{action.street}] P{action.player}: {action.type}
                    {action.amount ? ` $${action.amount}` : ''}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* Notes */}
        <View style={styles.notesSection}>
          <Text style={styles.sectionLabel}>Notes</Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Hand notes..."
            placeholderTextColor={colors.muted}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Save/Reset Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity style={styles.resetButton} onPress={resetHand}>
            <Text style={styles.resetButtonText}>Reset</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveButton} onPress={saveHand}>
            <Text style={styles.saveButtonText}>Save Hand</Text>
          </TouchableOpacity>
        </View>

        {/* Card Picker Modal */}
        <Modal visible={showCardPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.cardPickerModal}>
              <Text style={styles.modalTitle}>
                Select {cardPickerTarget === 'hero' ? 'Hole' : 'Community'} Card
              </Text>
              {SUITS.map(suit => (
                <View key={suit} style={styles.suitRow}>
                  {RANKS.map(rank => {
                    const card = `${rank}${suit}`;
                    const isSelected = heroCards.includes(card) || communityCards.includes(card);
                    return (
                      <TouchableOpacity
                        key={card}
                        style={[
                          styles.pickerCard,
                          isSelected && styles.pickerCardDisabled,
                        ]}
                        onPress={() => !isSelected && selectCard(card)}
                        disabled={isSelected}
                      >
                        <Text style={[
                          styles.pickerCardText,
                          (suit === '♥' || suit === '♦') && styles.redCard,
                          isSelected && styles.pickerCardTextDisabled,
                        ]}>
                          {rank}{suit}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
              <TouchableOpacity
                style={styles.closeModalButton}
                onPress={() => setShowCardPicker(false)}
              >
                <Text style={styles.closeModalText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.white,
    marginVertical: spacing.lg,
  },
  tableContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  table: {
    width: 300,
    height: 240,
    backgroundColor: '#0d5c36',
    borderRadius: 150,
    borderWidth: 8,
    borderColor: '#8b4513',
    position: 'relative',
  },
  communityArea: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -60 }, { translateY: -40 }],
    alignItems: 'center',
  },
  potText: {
    color: colors.white,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: 4,
  },
  communityCards: {
    flexDirection: 'row',
    gap: 4,
  },
  communityCard: {
    width: 28,
    height: 38,
    backgroundColor: colors.white,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  redCard: {
    color: '#dc2626',
  },
  addCardButton: {
    width: 28,
    height: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderStyle: 'dashed',
  },
  addCardText: {
    color: colors.white,
    fontSize: fontSize.lg,
  },
  streetText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    marginTop: 4,
  },
  seat: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedSeat: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(16,185,129,0.3)',
  },
  heroSeat: {
    borderColor: '#f59e0b',
  },
  seatLabel: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '600',
  },
  seatNumber: {
    color: colors.muted,
    fontSize: 10,
  },
  heroSection: {
    marginBottom: spacing.lg,
  },
  sectionLabel: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  heroCards: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  heroCard: {
    width: 60,
    height: 84,
    backgroundColor: colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  heroCardText: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: '#000',
  },
  addHeroCard: {
    width: 60,
    height: 84,
    backgroundColor: colors.glass,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  actionsSection: {
    marginBottom: spacing.lg,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  foldButton: {
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.4)',
  },
  checkButton: {
    backgroundColor: 'rgba(156,163,175,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(156,163,175,0.4)',
  },
  callButton: {
    backgroundColor: 'rgba(59,130,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.4)',
  },
  betButton: {
    backgroundColor: 'rgba(16,185,129,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.4)',
  },
  raiseButton: {
    backgroundColor: 'rgba(245,158,11,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.4)',
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  betRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  betInput: {
    flex: 1,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.md,
  },
  streetControl: {
    marginBottom: spacing.lg,
  },
  streetButton: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
  },
  streetButtonText: {
    color: colors.accent,
    fontWeight: '600',
  },
  historySection: {
    marginBottom: spacing.lg,
  },
  historyList: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    maxHeight: 150,
  },
  emptyHistory: {
    color: colors.muted,
    textAlign: 'center',
  },
  historyItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  historyText: {
    color: colors.white,
    fontSize: fontSize.sm,
  },
  notesSection: {
    marginBottom: spacing.lg,
  },
  notesInput: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    color: colors.white,
    fontSize: fontSize.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  controlButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: 100,
  },
  resetButton: {
    flex: 1,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  resetButtonText: {
    color: colors.muted,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#052018',
    fontWeight: '700',
    fontSize: fontSize.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPickerModal: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '95%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  suitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  pickerCard: {
    width: 36,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerCardDisabled: {
    backgroundColor: colors.muted,
    opacity: 0.4,
  },
  pickerCardText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#000',
  },
  pickerCardTextDisabled: {
    color: '#666',
  },
  closeModalButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  closeModalText: {
    color: '#052018',
    fontWeight: '700',
  },
});