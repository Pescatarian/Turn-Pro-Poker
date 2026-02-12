import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface Props {
    children: ReactNode;
    fallbackMessage?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    state: State = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('ErrorBoundary caught:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Ionicons name="warning-outline" size={48} color={COLORS.danger} />
                        <Text style={styles.title}>Something went wrong</Text>
                        <Text style={styles.message}>
                            {this.props.fallbackMessage || 'An unexpected error occurred. Please try again.'}
                        </Text>
                        {__DEV__ && this.state.error && (
                            <Text style={styles.debugText} numberOfLines={4}>
                                {this.state.error.toString()}
                            </Text>
                        )}
                        <TouchableOpacity style={styles.retryButton} onPress={this.handleReset}>
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 40 : 50,
    },
    card: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 340,
    },
    title: {
        color: COLORS.text,
        fontSize: 20,
        fontWeight: '700',
        marginTop: 16,
        marginBottom: 8,
    },
    message: {
        color: COLORS.muted,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 16,
    },
    debugText: {
        color: COLORS.danger,
        fontSize: 11,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        backgroundColor: 'rgba(239,68,68,0.08)',
        padding: 8,
        borderRadius: 6,
        width: '100%',
        marginBottom: 16,
    },
    retryButton: {
        backgroundColor: COLORS.accent,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
});
