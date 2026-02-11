import { Tabs, useRouter } from 'expo-router';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useSessionModal } from '../../contexts/SessionModalContext';
import { COLORS } from '../../constants/theme';
import Svg, { Path, Rect, Circle, Line, Polyline } from 'react-native-svg';

// Custom SVG Icons matching prototype
// Custom SVG Icons matching index.html perfectly
// Verified match with index.html - Force Reload
const HomeIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const SessionsIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect x="3" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="14" y="3" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="14" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Rect x="3" y="14" width="7" height="7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

const AddIcon = ({ color, size }: { color: string; size: number }) => (
    <View style={styles.addButtonWrapper}>
        <View style={styles.addButton}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
                <Line x1="12" y1="5" x2="12" y2="19" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
                <Line x1="5" y1="12" x2="19" y2="12" stroke={COLORS.accent} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
        </View>
    </View>
);

const HandsIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <Line x1="9" y1="13" x2="15" y2="13" stroke={color} strokeWidth={2} strokeLinecap="round" />
        <Line x1="9" y1="17" x2="15" y2="17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
);

const MoreIcon = ({ color, size }: { color: string; size: number }) => (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Circle cx="5" cy="12" r="1.5" fill={color} />
        <Circle cx="12" cy="12" r="1.5" fill={color} />
        <Circle cx="19" cy="12" r="1.5" fill={color} />
    </Svg>
);

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TabLayout() {
    const { signOut } = useAuth();
    const router = useRouter();
    const { openAddModal } = useSessionModal();
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#0d0d0d',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255,255,255,0.02)',
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom + 10, // Adjusted for perfect vertical centering
                    paddingTop: 10, // Adjusted for perfect vertical centering
                },
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: COLORS.muted,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                },
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, size }) => <HomeIcon color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="sessions"
                options={{
                    title: 'Sessions',
                    tabBarIcon: ({ color, size }) => <SessionsIcon color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="add"
                options={{
                    title: 'Add',
                    tabBarIcon: ({ color, size }) => <AddIcon color={color} size={size} />,
                    tabBarLabelStyle: {
                        fontSize: 10,
                        fontWeight: '600',
                        color: COLORS.accent, // Always accent color as per index.html
                    },
                }}
                listeners={{
                    tabPress: (e) => {
                        e.preventDefault();
                        openAddModal();
                    },
                }}
            />
            <Tabs.Screen
                name="hand-histories"
                options={{
                    title: 'Hands',
                    tabBarIcon: ({ color, size }) => <HandsIcon color={color} size={size} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => <MoreIcon color={color} size={size} />,
                }}
            />
            {/* Hidden screens */}
            <Tabs.Screen
                name="bankroll"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="more/passcode-setup"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="more/transactions"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    addButtonWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    addButton: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: COLORS.accent,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent', // Match index.html
    },
});
