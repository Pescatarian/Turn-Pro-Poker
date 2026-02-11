import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PlaybackControlsProps {
    onShare: () => void;
    onPlay: () => void;
    onPrev: () => void;
    onNext: () => void;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ onShare, onPlay, onPrev, onNext }) => {
    return (
        <View>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={onShare} activeOpacity={0.7}>
                    <Text style={styles.btnText}>↑ Share</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={onPlay} activeOpacity={0.7}>
                    <Text style={styles.btnText}>▷ Play</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={onPrev} activeOpacity={0.7}>
                    <Text style={styles.navText}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.7}>
                    <Text style={styles.navText}>→</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 4,
    },
    btn: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnText: {
        color: '#fff',
        fontSize: 14,
    },
    navText: {
        color: '#fff',
        fontSize: 18,
    },
});
