import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenWrapper } from '../../components/ui/ScreenWrapper';
import { COLORS } from '../../constants/theme';

// This is a placeholder - the Add tab redirects to sessions/new
export default function AddScreen() {
    return (
        <ScreenWrapper>
            <View style={styles.container}>
                <Text style={styles.text}>Redirecting...</Text>
            </View>
        </ScreenWrapper>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        color: COLORS.muted,
        fontSize: 16,
    },
});
