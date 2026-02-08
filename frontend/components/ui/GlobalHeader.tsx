import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, GRADIENTS } from '../../constants/theme';

interface GlobalHeaderProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
}

// User Avatar with gradient ring
const UserAvatar = () => (
    <View style={styles.avatarWrapper}>
        <View style={styles.avatarRing}>
            <View style={styles.avatarInner}>
                <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={COLORS.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="12" cy="7" r="4" stroke={COLORS.accent} strokeWidth={2} />
                </Svg>
            </View>
        </View>
    </View>
);

// Search Icon
const SearchIcon = () => (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
        <Circle cx="11" cy="11" r="8" stroke={COLORS.muted} strokeWidth={2} />
        <Path d="M21 21l-4.35-4.35" stroke={COLORS.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
);

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({
    searchPlaceholder = "Search by BB, date, location...",
    searchValue = '',
    onSearchChange,
}) => {
    return (
        <View style={styles.container}>
            {/* User Avatar */}
            <UserAvatar />

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <SearchIcon />
                <TextInput
                    style={styles.searchInput}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={COLORS.muted}
                    value={searchValue}
                    onChangeText={onSearchChange}
                />
            </View>

            {/* Get Coach Button */}
            <TouchableOpacity style={styles.coachButton}>
                <LinearGradient
                    colors={GRADIENTS.button}
                    style={styles.coachGradient}
                >
                    <Text style={styles.coachText}>Get Coach</Text>
                </LinearGradient>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: COLORS.bg,
        gap: 10,
    },
    avatarWrapper: {
        width: 40,
        height: 40,
    },
    avatarRing: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarInner: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 8,
        gap: 8,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
    },
    coachButton: {
        borderRadius: 20,
        overflow: 'hidden',
    },
    coachGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    coachText: {
        color: '#052018',
        fontSize: 13,
        fontWeight: '700',
    },
});
