import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { PlusIcon } from '../components/icons';
import { Hand } from '../types';

export function HandsScreen() {
  const navigation = useNavigation();
  const [hands, setHands] = useState<Hand[]>([]);

  const renderHand = ({ item }: { item: Hand }) => {
    const heroCardsDisplay = item.heroCards?.join(' ') || '? ?';
    const communityDisplay = item.communityCards?.join(' ') || '';

    return (
      <TouchableOpacity style={styles.handCard}>
        <View style={styles.handHeader}>
          <View style={styles.cardsDisplay}>
            <Text style={styles.heroCards}>{heroCardsDisplay}</Text>
          </View>
          <Text style={styles.handPot}>${item.pot}</Text>
        </View>
        {communityDisplay && (
          <Text style={styles.communityCards}>{communityDisplay}</Text>
        )}
        <View style={styles.handMeta}>
          <Text style={styles.handDate}>
            {new Date(item.date).toLocaleDateString()}
          </Text>
          <Text style={styles.handStreet}>{item.street}</Text>
          <Text style={styles.handActions}>{item.actions?.length || 0} actions</Text>
        </View>
        {item.notes && (
          <Text style={styles.handNotes} numberOfLines={2}>{item.notes}</Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hands</Text>
          <Text style={styles.subtitle}>{hands.length} recorded</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('HandReplayer' as never)}
        >
          <PlusIcon color="#052018" size={20} />
          <Text style={styles.addButtonText}>New Hand</Text>
        </TouchableOpacity>
      </View>

      {hands.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Text style={styles.emptyIconText}>🃏</Text>
          </View>
          <Text style={styles.emptyTitle}>No hands recorded</Text>
          <Text style={styles.emptySubtext}>
            Use the Hand Replayer to record and analyze your poker hands
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => navigation.navigate('HandReplayer' as never)}
          >
            <Text style={styles.emptyButtonText}>Record First Hand</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hands}
          renderItem={renderHand}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  title: {
    fontSize: fontSize.xxl,
    fontWeight: '800',
    color: colors.white,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  addButtonText: {
    color: '#052018',
    fontWeight: '700',
    fontSize: fontSize.sm,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  handCard: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  handHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardsDisplay: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  heroCards: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.white,
  },
  handPot: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.accent,
  },
  communityCards: {
    fontSize: fontSize.md,
    color: colors.muted,
    marginBottom: spacing.sm,
  },
  handMeta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  handDate: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  handStreet: {
    fontSize: fontSize.sm,
    color: colors.accent,
    textTransform: 'capitalize',
  },
  handActions: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  handNotes: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
  },
  emptyIconText: {
    fontSize: 64,
  },
  emptyTitle: {
    fontSize: fontSize.xl,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: fontSize.md,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  emptyButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    color: '#052018',
    fontWeight: '700',
    fontSize: fontSize.md,
  },
});