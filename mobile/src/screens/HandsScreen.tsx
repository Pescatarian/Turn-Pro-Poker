import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { PlusIcon } from '../components/icons';

export function HandsScreen() {
  // TODO: Load hands from store
  const hands: any[] = [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Hands</Text>
        <TouchableOpacity style={styles.addButton}>
          <PlusIcon color="#052018" size={20} />
          <Text style={styles.addButtonText}>Add Hand</Text>
        </TouchableOpacity>
      </View>

      {hands.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <PlusIcon color={colors.muted} size={48} />
          </View>
          <Text style={styles.emptyTitle}>No hands recorded</Text>
          <Text style={styles.emptySubtext}>
            Tap + Add Hand to record your first hand
          </Text>
        </View>
      ) : (
        <FlatList
          data={hands}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.handCard}>
              <View style={styles.handHeader}>
                <Text style={styles.handPot}>Pot: ${item.pot}</Text>
                <Text style={styles.handDate}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.handDetails}>
                {item.actions?.length || 0} actions • {item.street}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
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
  },
  handPot: {
    fontSize: fontSize.md,
    fontWeight: '600',
    color: colors.white,
  },
  handDate: {
    fontSize: fontSize.sm,
    color: colors.muted,
  },
  handDetails: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.md,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: fontSize.sm,
    color: colors.muted,
    textAlign: 'center',
  },
});