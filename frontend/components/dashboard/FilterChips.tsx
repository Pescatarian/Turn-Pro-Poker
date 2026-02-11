import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { useLocations } from '../../hooks/useLocations';

export type TimeRange = 'week' | 'month' | '3months' | 'year' | 'all';

interface FilterChipsProps {
    selectedTimeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
    selectedVenue: string | null;
    onVenueChange: (venue: string | null) => void;
}

const TIME_LABELS: Record<TimeRange, string> = {
    week: 'This Week',
    month: 'This Month',
    '3months': '3 Months',
    year: 'This Year',
    all: 'All Time',
};

const TIME_OPTIONS: TimeRange[] = ['week', 'month', '3months', 'year', 'all'];

export function FilterChips({
    selectedTimeRange,
    onTimeRangeChange,
    selectedVenue,
    onVenueChange,
}: FilterChipsProps) {
    const locations = useLocations();
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [showVenuePicker, setShowVenuePicker] = useState(false);

    const venueOptions = [null, ...locations];

    return (
        <View style={styles.container}>
            {/* Time Range Chip */}
            <TouchableOpacity
                style={[styles.chip, selectedTimeRange !== 'all' && styles.chipActive]}
                onPress={() => setShowTimePicker(true)}
            >
                <Ionicons name="calendar-outline" size={12} color={selectedTimeRange !== 'all' ? '#052018' : COLORS.muted} />
                <Text style={[styles.chipText, selectedTimeRange !== 'all' && styles.chipTextActive]} numberOfLines={1}>
                    {TIME_LABELS[selectedTimeRange]}
                </Text>
                <Ionicons name="chevron-down" size={10} color={selectedTimeRange !== 'all' ? '#052018' : COLORS.muted} />
            </TouchableOpacity>

            {/* Venue Chip */}
            {locations.length > 0 && (
                <TouchableOpacity
                    style={[styles.chip, selectedVenue !== null && styles.chipActive]}
                    onPress={() => setShowVenuePicker(true)}
                >
                    <Ionicons name="location-outline" size={12} color={selectedVenue ? '#052018' : COLORS.muted} />
                    <Text
                        style={[styles.chipText, selectedVenue !== null && styles.chipTextActive]}
                        numberOfLines={1}
                    >
                        {selectedVenue || 'All Venues'}
                    </Text>
                    <Ionicons name="chevron-down" size={10} color={selectedVenue ? '#052018' : COLORS.muted} />
                </TouchableOpacity>
            )}

            {/* Time Range Picker Modal — .modal-backdrop + .modal from index.html */}
            <Modal visible={showTimePicker} transparent animationType="fade" onRequestClose={() => setShowTimePicker(false)}>
                <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setShowTimePicker(false)}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Time Range</Text>
                        {TIME_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt}
                                style={[styles.pickerOption, selectedTimeRange === opt && styles.pickerOptionActive]}
                                onPress={() => { onTimeRangeChange(opt); setShowTimePicker(false); }}
                            >
                                <Text style={[styles.pickerOptionText, selectedTimeRange === opt && styles.pickerOptionTextActive]}>
                                    {TIME_LABELS[opt]}
                                </Text>
                                {selectedTimeRange === opt && (
                                    <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Venue Picker Modal */}
            <Modal visible={showVenuePicker} transparent animationType="fade" onRequestClose={() => setShowVenuePicker(false)}>
                <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={() => setShowVenuePicker(false)}>
                    <View style={styles.pickerModal}>
                        <Text style={styles.pickerTitle}>Venue</Text>
                        <FlatList
                            data={venueOptions}
                            keyExtractor={(item, i) => item || `all-${i}`}
                            style={{ maxHeight: 300 }}
                            showsVerticalScrollIndicator={false}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[styles.pickerOption, (item === selectedVenue || (item === null && selectedVenue === null)) && styles.pickerOptionActive]}
                                    onPress={() => { onVenueChange(item); setShowVenuePicker(false); }}
                                >
                                    <Text style={[styles.pickerOptionText, (item === selectedVenue || (item === null && selectedVenue === null)) && styles.pickerOptionTextActive]}>
                                        {item || 'All Venues'}
                                    </Text>
                                    {(item === selectedVenue || (item === null && selectedVenue === null)) && (
                                        <Ionicons name="checkmark" size={18} color={COLORS.accent} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 6,
        flexWrap: 'nowrap',
    },
    /* Compact pill chips that fit inline */
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    chipActive: {
        backgroundColor: COLORS.accent,
        borderColor: COLORS.accent,
    },
    chipText: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.muted,
    },
    chipTextActive: {
        color: '#052018',
    },
    /* .modal-backdrop from index.html: background:rgba(0,0,0,0.7) */
    pickerBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    /* .modal from index.html: linear-gradient(180deg,#0c0c0c,#070707) */
    pickerModal: {
        width: '80%',
        maxWidth: 380,
        backgroundColor: '#0c0c0c',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
    },
    /* .modal h3 */
    pickerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 6,
    },
    pickerOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 8,
    },
    pickerOptionActive: {
        backgroundColor: 'rgba(16,185,129,0.1)',
    },
    pickerOptionText: {
        fontSize: 14,
        color: COLORS.text,
    },
    pickerOptionTextActive: {
        fontWeight: '700',
        color: COLORS.accent,
    },
});
