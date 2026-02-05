import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, borderRadius } from '../constants/theme';
import { ChevronRightIcon } from '../components/icons';

interface MenuItemProps {
  title: string;
  subtitle?: string;
  onPress: () => void;
}

function MenuItem({ title, subtitle, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRightIcon color={colors.muted} size={20} />
    </TouchableOpacity>
  );
}

export function MoreScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>More</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <MenuItem title="Profile" subtitle="Edit your info" onPress={() => {}} />
            <MenuItem title="Subscription" subtitle="Manage your plan" onPress={() => {}} />
            <MenuItem title="Payment Methods" onPress={() => {}} />
          </View>
        </View>

        {/* Bankroll Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Bankroll</Text>
          <View style={styles.card}>
            <MenuItem title="Wallets" subtitle="Manage bankrolls" onPress={() => {}} />
            <MenuItem title="Transactions" subtitle="Deposits & withdrawals" onPress={() => {}} />
            <MenuItem title="Goals" subtitle="Set targets" onPress={() => {}} />
          </View>
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.card}>
            <MenuItem title="Export Data" subtitle="CSV, PDF" onPress={() => {}} />
            <MenuItem title="Import Sessions" onPress={() => {}} />
            <MenuItem title="Sync Status" subtitle="All synced" onPress={() => {}} />
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <View style={styles.card}>
            <MenuItem title="Currency" subtitle="USD" onPress={() => {}} />
            <MenuItem title="Timezone" onPress={() => {}} />
            <MenuItem title="Notifications" onPress={() => {}} />
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <MenuItem title="Help & FAQ" onPress={() => {}} />
            <MenuItem title="Contact Us" onPress={() => {}} />
            <MenuItem title="Privacy Policy" onPress={() => {}} />
            <MenuItem title="Terms of Service" onPress={() => {}} />
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Turn Pro Poker v1.0.0</Text>
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
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.muted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: fontSize.md,
    fontWeight: '500',
    color: colors.white,
  },
  menuItemSubtitle: {
    fontSize: fontSize.sm,
    color: colors.muted,
    marginTop: 2,
  },
  logoutButton: {
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  logoutText: {
    color: colors.danger,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: colors.muted,
    fontSize: fontSize.sm,
    marginBottom: 100,
  },
});