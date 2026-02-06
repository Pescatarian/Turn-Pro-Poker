import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { ReplayerState, Action } from '../model/Replayer';

const { width } = Dimensions.get('window');

interface HandReplayerProps {
  initialState?: ReplayerState; // Optional for now, usually would pass full hand history
}

export default function HandReplayer({ initialState }: HandReplayerProps) {
  const [step, setStep] = useState(0);

  // Mock data if no initial state
  const actions: Action[] = initialState?.actions || [
    { seatIndex: 0, type: 'bet', amount: 5 },
    { seatIndex: 1, type: 'call', amount: 5 },
    { seatIndex: 2, type: 'fold' },
  ];

  const currentAction = actions[step];

  const handleNext = () => {
    if (step < actions.length - 1) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <View style={styles.container}>
      <View style={styles.table}>
        <Text style={styles.potText}>Pot: ${100}</Text>
        {/* Placeholder seats */}
        <View style={[styles.seat, { top: 20, left: width / 2 - 30 }]}>
          <Text style={styles.seatText}>P1</Text>
        </View>
        <View style={[styles.seat, { bottom: 20, left: 40 }]}>
          <Text style={styles.seatText}>Hero</Text>
        </View>
        <View style={[styles.seat, { bottom: 20, right: 40 }]}>
          <Text style={styles.seatText}>P3</Text>
        </View>

        {/* Community Cards */}
        <View style={styles.communityCards}>
          <View style={styles.card}><Text>A♠</Text></View>
          <View style={styles.card}><Text>K♥</Text></View>
          <View style={styles.card}><Text>T♦</Text></View>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={handlePrev} style={styles.button}>
          <Text style={styles.buttonText}>Prev</Text>
        </TouchableOpacity>
        <View style={styles.actionDisplay}>
          <Text style={styles.actionText}>
            {currentAction
              ? `Seat ${currentAction.seatIndex + 1}: ${currentAction.type} ${currentAction.amount || ''}`
              : 'Start'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleNext} style={styles.button}>
          <Text style={styles.buttonText}>Next</Text>
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
    height: 250,
    backgroundColor: '#35654d',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: '#4e342e',
    position: 'relative',
    marginBottom: 20,
  },
  potText: {
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  seat: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  seatText: {
    color: '#fff',
    fontSize: 12,
  },
  communityCards: {
    flexDirection: 'row',
  },
  card: {
    width: 30,
    height: 45,
    backgroundColor: '#fff',
    borderRadius: 4,
    marginHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#e94560',
    padding: 10,
    borderRadius: 5,
    width: 60,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
  },
  actionDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});
