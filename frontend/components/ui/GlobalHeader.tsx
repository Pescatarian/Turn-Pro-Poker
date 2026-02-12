import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { COLORS, GRADIENTS } from '../../constants/theme';

interface GlobalHeaderProps {
    searchPlaceholder?: string;
    searchValue?: string;
    onSearchChange?: (text: string) => void;
    headerContent?: React.ReactNode;
}

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
    headerContent,
}) => {
    const router = useRouter();
    return (
        <View style={styles.container}>
            {/* Custom header content OR Search Bar */}
            {headerContent ? (
                <View style={styles.customContent}>{headerContent}</View>
            ) : (
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
            )}

            {/* Get Coach Button */}
            <TouchableOpacity style={styles.coachButton} onPress={() => router.push('/coach' as any)}>
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
    customContent: {
        flex: 1,
    },
});
