import { Slot } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <SubscriptionProvider>
        <Slot />
        <StatusBar style="light" />
      </SubscriptionProvider>
    </AuthProvider>
  );
}
