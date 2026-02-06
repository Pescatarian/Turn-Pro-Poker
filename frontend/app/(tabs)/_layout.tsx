import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { TouchableOpacity } from 'react-native';

export default function TabLayout() {
    const { signOut } = useAuth();

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1a1a2e',
                    borderBottomWidth: 0,
                },
                headerTitleStyle: {
                    color: '#fff',
                    fontWeight: 'bold',
                },
                headerTintColor: '#fff',
                tabBarStyle: {
                    backgroundColor: '#16213e',
                    borderTopWidth: 0,
                    height: 60,
                    paddingBottom: 8,
                },
                tabBarActiveTintColor: '#e94560',
                tabBarInactiveTintColor: '#888',
            }}
        >
            <Tabs.Screen
                name="dashboard"
                options={{
                    title: 'Dashboard',
                    tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="sessions"
                options={{
                    title: 'Sessions',
                    tabBarIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />,
                    headerShown: false, // Stack navigator inside will handle header
                }}
            />
            <Tabs.Screen
                name="hand-histories/index"
                options={{
                    title: 'Hands',
                    tabBarIcon: ({ color, size }) => <Ionicons name="albums" size={size} color={color} />,
                    headerShown: false,
                }}
            />
            <Tabs.Screen
                name="bankroll"
                options={{
                    title: 'Bankroll',
                    tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="stats"
                options={{
                    title: 'Stats',
                    tabBarIcon: ({ color, size }) => <Ionicons name="stats-chart" size={size} color={color} />,
                }}
            />
            <Tabs.Screen
                name="more"
                options={{
                    title: 'More',
                    tabBarIcon: ({ color, size }) => <Ionicons name="menu" size={size} color={color} />,
                }}
            />
        </Tabs>
    );
}
