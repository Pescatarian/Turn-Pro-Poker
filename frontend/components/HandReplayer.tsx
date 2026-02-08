import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { ReplayerState, Action } from '../model/Replayer';
import { COLORS } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface HandReplayerProps {
  initialState?: ReplayerState;
}

// Action pill colors
const ACTION_COLORS: Record<string, string> = {
  fold: '#4b5563',
  check: COLORS.accent,
  call: COLORS.accent,
  bet: COLORS.chartGold,
  raise: COLORS.danger,
  'all-in': '#9333ea',
};

const ActionPill = ({ action, isActive, onPress, index }: {
  action: Action;
  isActive: boolean;
  onPress: () => void;
  index: number;
}) => {
  const color = ACTION_COLORS[action.type] || COLORS.muted;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionPill,
        { backgroundColor: isActive ? color : 'rgba(255,255,255,0.08)', borderColor: color }
      ]}
    >
      <Text style={[styles.actionPillText, { color: isActive ? '#fff' : color }]}>
        {action.type.toUpperCase()}
        {action.amount ? ` $${action.amount}` : ''}
      </Text>
      <Text style={[styles.actionPillSeat, { color: isActive ? 'rgba(255,255,255,0.7)' : COLORS.muted }]}>
        P{action.seatIndex + 1}
      </Text>
    </TouchableOpacity>
  );
};

export default function HandReplayer({ initialState }: HandReplayerProps) {
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState<'history' | 'notes'>('history');
  const scrollRef = useRef<ScrollView>(null);

  // Mock data if no initial state
  const actions: Action[] = initialState?.actions || [
    { seatIndex: 0, type: 'bet', amount: 5 },
    { seatIndex: 1, type: 'call', amount: 5 },
    { seatIndex: 2, type: 'fold' },
    { seatIndex: 0, type: 'bet', amount: 15 },
    { seatIndex: 1, type: 'raise', amount: 45 },
    { seatIndex: 0, type: 'call', amount: 45 },
  ];

  const currentAction = actions[step];

  const handleNext = () => {
    if (step < actions.length - 1) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const goToStep = (index: number) => {
    setStep(index);
  };

  return (
    <View style={styles.container}>
      {/* Table */}
      <View style={styles.table}>
        <Text style={styles.potText}>Pot: $100</Text>
        {/* Placeholder seats */}
        <View style={[styles.seat, { top: 20, left: width / 2 - 50 }]}>
          <Text style={styles.seatText}>P1</Text>
        </View>
        <View style={[styles.seat, { bottom: 20, left: 40 }]}>
          <Text style={[styles.seatText, { color: COLORS.accent }]}>Hero</Text>
        </View>
        <View style={[styles.seat, { bottom: 20, right: 40 }]}>
          <Text style={styles.seatText}>P3</Text>
        </View>

        {/* Community Cards */}
        <View style={styles.communityCards}>
          <View style={styles.card}><Text style={styles.cardText}>A♠</Text></View>
          <View style={styles.card}><Text style={[styles.cardText, { color: 'red' }]}>K♥</Text></View>
          <View style={styles.card}><Text style={[styles.cardText, { color: 'red' }]}>T♦</Text></View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>Action History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'notes' && styles.tabActive]}
          onPress={() => setActiveTab('notes')}
        >
          <Text style={[styles.tabText, activeTab === 'notes' && styles.tabTextActive]}>Notes</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'history' ? (
        <>
          {/* Action History Pills */}
          <ScrollView
            ref={scrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.actionHistory}
            contentContainerStyle={styles.actionHistoryContent}
          >
            {actions.map((action, index) => (
              <ActionPill
                key={index}
                action={action}
                isActive={index === step}
                onPress={() => goToStep(index)}
                index={index}
              />
            ))}
          </ScrollView>

          {/* Current Action Display */}
          <View style={styles.currentAction}>
            <Text style={styles.currentActionLabel}>Current Action:</Text>
            <Text style={styles.currentActionText}>
              {currentAction
                ? `Seat ${currentAction.seatIndex + 1}: ${currentAction.type.toUpperCase()} ${currentAction.amount ? `$${currentAction.amount}` : ''}`
                : 'Start of hand'}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.notesContainer}>
          <Text style={styles.notesPlaceholder}>No notes for this hand.</Text>
        </View>
      )}

      {/* Playback Controls */}
      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePrev} style={styles.controlButton} disabled={step === 0}>
          <Ionicons name="play-back" size={20} color={step === 0 ? COLORS.muted : '#fff'} />
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>{step + 1} / {actions.length}</Text>
        </View>

        <TouchableOpacity onPress={handleNext} style={styles.controlButton} disabled={step >= actions.length - 1}>
          <Ionicons name="play-forward" size={20} color={step >= actions.length - 1 ? COLORS.muted : '#fff'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
  },
  table: {
    width: width - 40,
    height: 200,
    backgroundColor: '#1a472a',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#6b4423',
    position: 'relative',
    marginBottom: 16,
  },
  potText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  seat: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.glassBorder,
  },
  seatText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  communityCards: {
    flexDirection: 'row',
    gap: 4,
  },
  card: {
    width: 32,
    height: 46,
    backgroundColor: '#fff',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cardText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: COLORS.accent,
  },
  tabText: {
    color: COLORS.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#052018',
  },
  actionHistory: {
    maxHeight: 60,
    marginBottom: 12,
  },
  actionHistoryContent: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 10,
  },
  actionPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 70,
  },
  actionPillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  actionPillSeat: {
    fontSize: 9,
    marginTop: 2,
  },
  currentAction: {
    alignItems: 'center',
    marginBottom: 16,
  },
  currentActionLabel: {
    color: COLORS.muted,
    fontSize: 11,
    marginBottom: 4,
  },
  currentActionText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  notesContainer: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notesPlaceholder: {
    color: COLORS.muted,
    fontStyle: 'italic',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
  },
  stepText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
