import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface PlaybackControlsProps {
    onShare: () => void;
    onPlay: () => void;
    onPrev: () => void;
    onNext: () => void;
    isPlaying?: boolean;
    hasActions?: boolean;
}

export const PlaybackControls: React.FC<PlaybackControlsProps> = ({ onShare, onPlay, onPrev, onNext, isPlaying, hasActions }) => {
    return (
        <View>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={onShare} activeOpacity={0.7}>
                    <Text style={styles.btnText}>↑ Share</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.btn, isPlaying && styles.btnActive]}
                    onPress={onPlay}
                    activeOpacity={0.7}
                    disabled={!hasActions && !isPlaying}
                >
                    <Text style={[styles.btnText, isPlaying && styles.btnTextActive]}>
                        {isPlaying ? '⏸ Pause' : '▷ Play'}
                    </Text>
                </TouchableOpacity>
            </View>
            <View style={styles.row}>
                <TouchableOpacity style={styles.btn} onPress={onPrev} activeOpacity={0.7} disabled={isPlaying}>
                    <Text style={[styles.navText, isPlaying && styles.navTextDisabled]}>←</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.7} disabled={isPlaying}>
                    <Text style={[styles.navText, isPlaying && styles.navTextDisabled]}>→</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: 'row',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 3,
    },
    btn: {
        flex: 1,
        paddingVertical: 8,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    btnActive: {
        backgroundColor: 'rgba(239,68,68,0.3)',
        borderWidth: 1,
        borderColor: '#ef4444',
    },
    btnText: {
        color: '#fff',
        fontSize: 12,
    },
    btnTextActive: {
        color: '#ef4444',
        fontWeight: '600',
    },
    navText: {
        color: '#fff',
        fontSize: 16,
    },
    navTextDisabled: {
        color: 'rgba(255,255,255,0.3)',
    },
});
