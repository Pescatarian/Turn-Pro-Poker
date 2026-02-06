import { Stack } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function SessionsLayout() {
    const router = useRouter();

    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: '#1a1a2e',
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: 'bold',
                },
            }}
        >
            <Stack.Screen
                name="index"
                options={{
                    title: 'Sessions',
                    headerRight: () => (
                        <TouchableOpacity onPress={() => router.push('/(tabs)/sessions/new' as any)}>
                            <Ionicons name="add" size={24} color="#e94560" style={{ marginRight: 15 }} />
                        </TouchableOpacity>
                    ),
                }}
            />
            <Stack.Screen
                name="[id]"
                options={{
                    title: 'Session Details',
                }}
            />
            <Stack.Screen
                name="new"
                options={{
                    title: 'New Session',
                    presentation: 'modal',
                }}
            />
        </Stack>
    );
}
