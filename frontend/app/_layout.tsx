import { Slot } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { SessionModalProvider } from '../contexts/SessionModalContext';
import { PasscodeLockProvider, usePasscodeLock } from '../contexts/PasscodeLockContext';
import { SyncProvider } from '../contexts/SyncContext';
import { ApiConfigProvider } from '../contexts/ApiConfigContext';
import { PrivacyProvider } from '../contexts/PrivacyContext';
import { ToastProvider } from '../components/ui/ToastProvider';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { PasscodeLockScreen } from '../components/auth/PasscodeLockScreen';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';

// Inner component that has access to auth context
function AppWithPasscodeLock() {
  const { user } = useAuth();
  const isAuthenticated = !!user;

  return (
    <PasscodeLockProvider isAuthenticated={isAuthenticated}>
      <SessionModalProvider>
        <PasscodeLockOverlay />
        <Slot />
        <StatusBar style="light" />
      </SessionModalProvider>
    </PasscodeLockProvider>
  );
}

// Overlay that shows lock screen when locked
function PasscodeLockOverlay() {
  const { isLocked, isLoading } = usePasscodeLock();

  if (isLoading) return null;
  if (!isLocked) return null;

  return (
    <View style={styles.overlay}>
      <PasscodeLockScreen />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <ApiConfigProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <SyncProvider>
              <PrivacyProvider>
                <ToastProvider>
                  <AppWithPasscodeLock />
                </ToastProvider>
              </PrivacyProvider>
            </SyncProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ApiConfigProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
});
