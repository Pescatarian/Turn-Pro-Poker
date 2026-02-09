import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { ApiSettingsModal } from '../../components/ApiSettingsModal';
import { useApiConfig } from '../../contexts/ApiConfigContext';
import qs from 'qs'; // Ensure you have qs or use URLSearchParams if compatible with Expo's environment


export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const { signIn } = useAuth();
    const { apiBaseUrl } = useApiConfig();
    const router = useRouter();



    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please enter both email and password');
            return;
        }

        setLoading(true);
        try {
            // Backend expects OAuth2 form data
            const formData = qs.stringify({
                username: email,
                password: password,
            });

            const response = await api.post('/auth/login', formData, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            });

            const { access_token } = response.data;
            await signIn(access_token);
            // AuthContext will handle redirect
        } catch (error: any) {
            console.error('❌ Login Error Details:');
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Response status:', error.response?.status);
            console.error('Response data:', JSON.stringify(error.response?.data));
            console.error('Request URL:', error.config?.baseURL + error.config?.url);

            let errorMessage = 'An error occurred';

            if (error.code === 'ERR_NETWORK' || error.message?.includes('Network')) {
                errorMessage = `Cannot connect to backend server. Check your internet connection or WiFi.\n\nTried: ${error.config?.baseURL || 'Unknown URL'}`;
            } else if (error.response?.status === 401) {
                errorMessage = error.response?.data?.detail || 'Invalid email or password';
            } else if (error.response?.data?.detail) {
                errorMessage = error.response.data.detail;
            }

            Alert.alert('Login Failed', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Settings Button (top-right corner) */}
            <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => setShowSettings(true)}
            >
                <Text style={styles.settingsIcon}>⚙️</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Turn Pro Poker</Text>
            <Text style={styles.subtitle}>Sign In</Text>

            {/* Show current backend URL */}
            <Text style={styles.backendUrl}>Backend: {apiBaseUrl}</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#888"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#888"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Login</Text>
                )}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <Link href={"/(auth)/register" as any} asChild>
                    <TouchableOpacity>
                        <Text style={styles.link}>Sign Up</Text>
                    </TouchableOpacity>
                </Link>
            </View>

            {/* API Settings Modal */}
            <ApiSettingsModal
                visible={showSettings}
                onClose={() => setShowSettings(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1a1a2e',
        justifyContent: 'center',
        padding: 20,
    },
    settingsButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    settingsIcon: {
        fontSize: 28,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 20,
        color: '#888',
        textAlign: 'center',
        marginBottom: 10,
    },
    backendUrl: {
        fontSize: 11,
        color: '#4CAF50',
        textAlign: 'center',
        marginBottom: 30,
        fontFamily: 'monospace',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        backgroundColor: '#16213e',
        color: '#fff',
        padding: 15,
        borderRadius: 8,
        marginBottom: 15,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#0f3460',
    },
    button: {
        backgroundColor: '#e94560',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    footerText: {
        color: '#888',
    },
    link: {
        color: '#e94560',
        fontWeight: 'bold',
    },
});
