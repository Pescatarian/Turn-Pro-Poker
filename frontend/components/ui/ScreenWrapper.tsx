import React from 'react';
import { StyleSheet, ViewStyle, SafeAreaView, Platform, StatusBar, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { GlobalHeader } from './GlobalHeader';

interface ScreenWrapperProps {
    children: React.ReactNode;
    style?: ViewStyle;
    hideHeader?: boolean;
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    headerContent?: React.ReactNode;
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
    children,
    style,
    hideHeader = false,
    searchPlaceholder,
    searchValue,
    onSearchChange,
    headerContent,
}) => {
    return (
        <LinearGradient
            colors={[COLORS.bg, COLORS.bgGradientEnd]}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1.2 }}
        >
            <ExpoStatusBar style="light" />
            <SafeAreaView style={[styles.safeArea, style]}>
                {!hideHeader && (
                    <GlobalHeader
                        searchPlaceholder={searchPlaceholder}
                        searchValue={searchValue}
                        onSearchChange={onSearchChange}
                        headerContent={headerContent}
                    />
                )}
                <View style={styles.content}>
                    {children}
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
    },
    content: {
        flex: 1,
    },
});
