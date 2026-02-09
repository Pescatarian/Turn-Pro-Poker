import React, { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useApiConfig } from '../contexts/ApiConfigContext';

interface ApiSettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

const PRESET_URLS = [
    { label: 'Production (Render)', url: 'https://turn-pro-poker-api.onrender.com/api/v1' },
    { label: 'Local WiFi (192.168.1.152)', url: 'http://192.168.1.152:8000/api/v1' },
    { label: 'Local WiFi (172.20.32.1)', url: 'http://172.20.32.1:8000/api/v1' },
];

export function ApiSettingsModal({ visible, onClose }: ApiSettingsModalProps) {
    const { apiBaseUrl, setApiBaseUrl } = useApiConfig();
    const [customUrl, setCustomUrl] = useState(apiBaseUrl);

    const handleSave = async () => {
        if (!customUrl.trim()) {
            Alert.alert('Error', 'URL cannot be empty');
            return;
        }
        try {
            await setApiBaseUrl(customUrl.trim());
            Alert.alert('Success', 'Backend URL updated! Restart the app to apply changes.', [
                { text: 'OK', onPress: onClose }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save URL');
        }
    };

    const handlePresetSelect = async (url: string) => {
        setCustomUrl(url);
        try {
            await setApiBaseUrl(url);
            Alert.alert('Success', 'Backend URL updated! Restart the app to apply changes.', [
                { text: 'OK', onPress: onClose }
            ]);
        } catch (error) {
            Alert.alert('Error', 'Failed to save URL');
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true}>
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.title}>🔧 Backend Configuration</Text>

                    <Text style={styles.currentLabel}>Current URL:</Text>
                    <Text style={styles.currentUrl}>{apiBaseUrl}</Text>

                    <Text style={styles.sectionLabel}>Quick Presets:</Text>
                    {PRESET_URLS.map((preset, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.presetButton}
                            onPress={() => handlePresetSelect(preset.url)}
                        >
                            <Text style={styles.presetLabel}>{preset.label}</Text>
                            <Text style={styles.presetUrl}>{preset.url}</Text>
                        </TouchableOpacity>
                    ))}

                    <Text style={styles.sectionLabel}>Custom URL:</Text>
                    <TextInput
                        style={styles.input}
                        value={customUrl}
                        onChangeText={setCustomUrl}
                        placeholder="http://your-ip:8000/api/v1"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />

                    <View style={styles.buttons}>
                        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                            <Text style={styles.saveButtonText}>Save Custom</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                            <Text style={styles.cancelButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        padding: 20,
    },
    modal: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 20,
        maxHeight: '80%',
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    currentLabel: {
        fontSize: 12,
        color: '#888',
        marginBottom: 5,
    },
    currentUrl: {
        fontSize: 14,
        color: '#4CAF50',
        marginBottom: 20,
        padding: 10,
        backgroundColor: '#2a2a2a',
        borderRadius: 6,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
        marginTop: 15,
        marginBottom: 10,
    },
    presetButton: {
        backgroundColor: '#2a2a2a',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#444',
    },
    presetLabel: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    presetUrl: {
        color: '#888',
        fontSize: 12,
    },
    input: {
        backgroundColor: '#2a2a2a',
        color: '#fff',
        padding: 12,
        borderRadius: 8,
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#444',
    },
    buttons: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    saveButton: {
        flex: 1,
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#444',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: '#fff',
        fontSize: 16,
    },
});
