import React, { useState, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ScrollView, Platform, Animated, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { database } from '../../../model';
import Session from '../../../model/Session';
import { Q } from '@nozbe/watermelondb';
import { withObservables } from '@nozbe/watermelondb/react';
import { ScreenWrapper } from '../../../components/ui/ScreenWrapper';
import { GlassCard } from '../../../components/ui/GlassCard';
import { COLORS, GRADIENTS } from '../../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSessionModal } from '../../../contexts/SessionModalContext';
import { useLocations } from '../../../hooks/useLocations';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Swipeable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useToast } from '../../../components/ui/ToastProvider';

interface SessionFormData {
    date: string;
    location: string;
    buyIn: string;
    cashOut: string;
    hours: string;
    bbSize: string;
    tips: string;
    expenses: string;
    notes: string;
    gameType: 'Cash' | 'Tournament';
}

const emptyForm: SessionFormData = {
    date: new Date().toISOString().split('T')[0],
    location: '',
    buyIn: '',
    cashOut: '',
    hours: '',
    bbSize: '2',
    tips: '0',
    expenses: '0',
    notes: '',
    gameType: 'Cash',
};

// ─── Swipeable Session Card ───
const SessionCardComponent = ({
    session,
    onEdit,
    onRemove
}: {
    session: Session;
    onEdit: () => void;
    onRemove: () => void;
}) => {
    const swipeableRef = useRef<Swipeable>(null);
    const date = new Date(session.startTime ?? Date.now());
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const renderRightActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({
            inputRange: [-80, 0],
            outputRange: [0, 80],
            extrapolate: 'clamp',
        });
        return (
            <Animated.View style={[styles.swipeAction, styles.swipeDelete, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={styles.swipeActionButton}
                    onPress={() => {
                        swipeableRef.current?.close();
                        onRemove();
                    }}
                >
                    <Ionicons name="trash-outline" size={22} color="#fff" />
                    <Text style={styles.swipeActionText}>Delete</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderLeftActions = (
        progress: Animated.AnimatedInterpolation<number>,
        dragX: Animated.AnimatedInterpolation<number>
    ) => {
        const translateX = dragX.interpolate({
            inputRange: [0, 80],
            outputRange: [-80, 0],
            extrapolate: 'clamp',
        });
        return (
            <Animated.View style={[styles.swipeAction, styles.swipeEdit, { transform: [{ translateX }] }]}>
                <TouchableOpacity
                    style={styles.swipeActionButton}
                    onPress={() => {
                        swipeableRef.current?.close();
                        onEdit();
                    }}
                >
                    <Ionicons name="pencil-outline" size={22} color="#fff" />
                    <Text style={styles.swipeActionText}>Edit</Text>
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <Swipeable
            ref={swipeableRef}
            renderRightActions={renderRightActions}
            renderLeftActions={renderLeftActions}
            overshootRight={false}
            overshootLeft={false}
            friction={2}
        >
            <GlassCard style={styles.card}>
                {/* Header: Location/Date/Duration | Profit */}
                <View style={styles.cardHeader}>
                    <View style={styles.cardHeaderLeft}>
                        <Text style={styles.locationTitle}>{session.location || 'Unknown'}</Text>
                        <Text style={styles.dateTime}>
                            {formattedDate} • {session.durationHours.toFixed(0)}h
                        </Text>
                    </View>
                    <View style={styles.profitContainer}>
                        <Text style={styles.profitLabel}>Profit</Text>
                        <Text style={[
                            styles.profit,
                            { color: session.profit >= 0 ? COLORS.accent : COLORS.danger }
                        ]}>
                            {session.profit >= 0 ? '+' : ''}${session.profit.toFixed(0)}
                        </Text>
                    </View>
                </View>

                {/* Buy-in • Cash-out */}
                <Text style={styles.infoRow}>
                    Buy-in: ${session.buyIn} • Cash-out: ${session.cashOut}
                </Text>

                {/* Tips • Expenses */}
                <Text style={styles.infoRow}>
                    Tips: ${session.tips || 0} • Expenses: ${session.expenses || 0}
                </Text>

                {/* Notes + Swipe hint */}
                <View style={styles.cardFooter}>
                    <Text style={styles.notes} numberOfLines={1}>
                        {session.notes || 'No notes'}
                    </Text>
                    <View style={styles.swipeHint}>
                        <Ionicons name="swap-horizontal-outline" size={14} color={COLORS.muted} />
                        <Text style={styles.swipeHintText}>Swipe</Text>
                    </View>
                </View>
            </GlassCard>
        </Swipeable>
    );
};

const SessionCard = withObservables(['session'], ({ session }: { session: Session }) => ({
    session
}))(SessionCardComponent);

// ─── Location Dropdown ───
const LocationDropdown = ({
    value,
    onSelect,
    locations,
    onChangeText,
}: {
    value: string;
    onSelect: (loc: string) => void;
    locations: string[];
    onChangeText: (text: string) => void;
}) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const filtered = locations.filter(l =>
        l.toLowerCase().includes(value.toLowerCase()) && l !== value
    );

    return (
        <View style={styles.field}>
            <Text style={styles.label}>Location</Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={(v) => {
                    onChangeText(v);
                    setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder="Casino / Site"
                placeholderTextColor={COLORS.muted}
            />
            {showSuggestions && filtered.length > 0 && (
                <View style={styles.suggestions}>
                    <ScrollView style={{ maxHeight: 120 }} nestedScrollEnabled>
                        {filtered.slice(0, 5).map((loc, i) => (
                            <TouchableOpacity
                                key={i}
                                style={styles.suggestionItem}
                                onPress={() => {
                                    onSelect(loc);
                                    setShowSuggestions(false);
                                }}
                            >
                                <Ionicons name="location-outline" size={14} color={COLORS.accent} />
                                <Text style={styles.suggestionText}>{loc}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            )}
        </View>
    );
};

// ─── Game Type Toggle ───
const GameTypeToggle = ({
    value,
    onChange,
}: {
    value: 'Cash' | 'Tournament';
    onChange: (v: 'Cash' | 'Tournament') => void;
}) => (
    <View style={styles.fieldFull}>
        <Text style={styles.label}>Game Type</Text>
        <View style={styles.toggleRow}>
            <TouchableOpacity
                style={[styles.toggleBtn, value === 'Cash' && styles.toggleActive]}
                onPress={() => onChange('Cash')}
            >
                <Text style={[styles.toggleText, value === 'Cash' && styles.toggleTextActive]}>Cash</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.toggleBtn, value === 'Tournament' && styles.toggleActive]}
                onPress={() => onChange('Tournament')}
            >
                <Text style={[styles.toggleText, value === 'Tournament' && styles.toggleTextActive]}>Tournament</Text>
            </TouchableOpacity>
        </View>
    </View>
);


// ─── Main Page ───
const SessionsPage = ({ sessions }: { sessions: Session[] }) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { isOpen, editingSessionId, openAddModal, openEditModal, closeModal } = useSessionModal();
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [form, setForm] = useState<SessionFormData>(emptyForm);
    const savedLocations = useLocations();
    const { showToast } = useToast();

    // Date picker state
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Sync form when modal opens for editing
    React.useEffect(() => {
        if (isOpen && editingSessionId) {
            const session = sessions.find(s => s.id === editingSessionId);
            if (session) {
                setEditingSession(session);
                const d = new Date(session.startTime ?? Date.now());
                setSelectedDate(d);
                setForm({
                    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
                    location: session.location || '',
                    buyIn: String(session.buyIn),
                    cashOut: String(session.cashOut),
                    hours: String(session.durationHours.toFixed(1)),
                    bbSize: String(session.bigBlind),
                    tips: String(session.tips || 0),
                    expenses: String(session.expenses || 0),
                    notes: session.notes || '',
                    gameType: (session.gameType || '').includes('ournament') ? 'Tournament' : 'Cash',
                });
            }
        } else if (isOpen && !editingSessionId) {
            setEditingSession(null);
            setSelectedDate(new Date());
            setForm(emptyForm);
        }
    }, [isOpen, editingSessionId]);

    const filteredSessions = useMemo(() => {
        if (!searchQuery.trim()) return [...sessions];
        const query = searchQuery.toLowerCase();
        return sessions.filter(s =>
            s.location?.toLowerCase().includes(query) ||
            s.notes?.toLowerCase().includes(query) ||
            s.stakes?.toLowerCase().includes(query) ||
            s.gameType?.toLowerCase().includes(query)
        );
    }, [sessions, searchQuery]);

    const handleRemove = useCallback(async (session: Session) => {
        const doDelete = async () => {
            try {
                await database.write(async () => {
                    await session.destroyPermanently();
                });
            } catch (e) {
                console.error(e);
                if (Platform.OS === 'web') {
                    window.alert('Failed to delete session');
                } else {
                    showToast('Failed to delete session', 'error');
                }
            }
        };

        if (Platform.OS === 'web') {
            if (window.confirm('Are you sure you want to delete this session?')) {
                await doDelete();
            }
        } else {
            Alert.alert(
                'Remove Session',
                'Are you sure you want to delete this session?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: doDelete,
                    },
                ]
            );
        }
    }, []);

    const handleSave = async () => {
        const buyIn = parseFloat(form.buyIn) || 0;
        const cashOut = parseFloat(form.cashOut) || 0;
        const hours = parseFloat(form.hours) || 0;
        const bbSize = parseFloat(form.bbSize) || 2;
        const tips = parseFloat(form.tips) || 0;
        const expenses = parseFloat(form.expenses) || 0;

        const startDate = new Date(form.date);
        const endDate = new Date(startDate.getTime() + hours * 60 * 60 * 1000);

        const gameTypeStr = form.gameType === 'Tournament' ? 'Tournament' : 'Holdem Cash';

        try {
            await database.write(async () => {
                if (editingSession) {
                    await editingSession.update((s: Session) => {
                        s.startTime = startDate;
                        s.endTime = endDate;
                        s.location = form.location;
                        s.buyIn = buyIn;
                        s.cashOut = cashOut;
                        s.bigBlind = bbSize;
                        s.smallBlind = bbSize / 2;
                        s.tips = tips;
                        s.expenses = expenses;
                        s.notes = form.notes;
                        s.gameType = gameTypeStr;
                        s.stakes = `${bbSize / 2}/${bbSize}`;
                    });
                } else {
                    await database.collections.get('sessions').create((s: any) => {
                        s.startTime = startDate;
                        s.endTime = endDate;
                        s.gameType = gameTypeStr;
                        s.stakes = `${bbSize / 2}/${bbSize}`;
                        s.smallBlind = bbSize / 2;
                        s.bigBlind = bbSize;
                        s.buyIn = buyIn;
                        s.cashOut = cashOut;
                        s.location = form.location;
                        s.notes = form.notes;
                        s.tips = tips;
                        s.expenses = expenses;
                    });
                }
            });
            closeModal();
        } catch (e) {
            console.error(e);
            showToast('Failed to save session', 'error');
        }
    };

    const updateForm = (key: keyof SessionFormData, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const onDateChange = (_event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (date) {
            setSelectedDate(date);
            const formatted = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            updateForm('date', formatted);
        }
    };

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <ScreenWrapper
                searchPlaceholder="Search by location, note..."
                searchValue={searchQuery}
                onSearchChange={setSearchQuery}
            >
                <View style={styles.container}>
                    {/* Sessions List */}
                    <ScrollView
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                    >
                        {filteredSessions.length > 0 ? (
                            filteredSessions.map(session => (
                                <SessionCard
                                    key={session.id}
                                    session={session}
                                    onEdit={() => openEditModal(session.id)}
                                    onRemove={() => handleRemove(session)}
                                />
                            ))
                        ) : (
                            <GlassCard style={styles.emptyCard}>
                                <Ionicons name="calendar-outline" size={48} color={COLORS.muted} style={{ opacity: 0.5 }} />
                                <Text style={styles.emptyTitle}>No sessions found</Text>
                                <Text style={styles.emptySubtitle}>
                                    {searchQuery ? 'Try a different search' : 'Tap + Add to log your first session'}
                                </Text>
                            </GlassCard>
                        )}
                    </ScrollView>


                    {/* Add/Edit Session Modal */}
                    <Modal
                        visible={isOpen}
                        animationType="fade"
                        transparent
                        onRequestClose={closeModal}
                    >
                        <KeyboardAvoidingView
                            style={styles.modalBackdrop}
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        >
                            <View style={styles.modal}>
                                <Text style={styles.modalTitle}>
                                    {editingSession ? 'Edit Session' : 'Add Session'}
                                </Text>
                                <Text style={styles.modalSubtitle}>Track your poker session</Text>

                                <ScrollView showsVerticalScrollIndicator={false}>
                                    {/* Game Type Toggle */}
                                    <GameTypeToggle
                                        value={form.gameType}
                                        onChange={(v) => setForm(prev => ({ ...prev, gameType: v }))}
                                    />

                                    {/* Date | Location */}
                                    <View style={styles.formRow}>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Date</Text>
                                            {Platform.OS === 'web' ? (
                                                <TextInput
                                                    style={styles.input}
                                                    value={form.date}
                                                    onChangeText={v => updateForm('date', v)}
                                                    placeholder="YYYY-MM-DD"
                                                    placeholderTextColor={COLORS.muted}
                                                />
                                            ) : (
                                                <>
                                                    <TouchableOpacity
                                                        style={styles.input}
                                                        onPress={() => setShowDatePicker(true)}
                                                    >
                                                        <Text style={styles.dateDisplay}>{form.date}</Text>
                                                    </TouchableOpacity>
                                                    {showDatePicker && (
                                                        <DateTimePicker
                                                            value={selectedDate}
                                                            mode="date"
                                                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                                            onChange={onDateChange}
                                                            themeVariant="dark"
                                                        />
                                                    )}
                                                </>
                                            )}
                                        </View>
                                        <LocationDropdown
                                            value={form.location}
                                            onSelect={(loc) => updateForm('location', loc)}
                                            locations={savedLocations}
                                            onChangeText={(v) => updateForm('location', v)}
                                        />
                                    </View>

                                    {/* Buy-in | Cash-out */}
                                    <View style={styles.formRow}>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Buy-in</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.buyIn}
                                                onChangeText={v => updateForm('buyIn', v)}
                                                placeholder="e.g. 200"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Cash-out</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.cashOut}
                                                onChangeText={v => updateForm('cashOut', v)}
                                                placeholder="e.g. 450"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {/* Hours | BB Size */}
                                    <View style={styles.formRow}>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Hours</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.hours}
                                                onChangeText={v => updateForm('hours', v)}
                                                placeholder="e.g. 4.5"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>BB Size</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.bbSize}
                                                onChangeText={v => updateForm('bbSize', v)}
                                                placeholder="e.g. 5"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {/* Tips | Expenses */}
                                    <View style={styles.formRow}>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Tips ($)</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.tips}
                                                onChangeText={v => updateForm('tips', v)}
                                                placeholder="e.g. 20"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                        <View style={styles.field}>
                                            <Text style={styles.label}>Expenses ($)</Text>
                                            <TextInput
                                                style={styles.input}
                                                value={form.expenses}
                                                onChangeText={v => updateForm('expenses', v)}
                                                placeholder="e.g. 15"
                                                placeholderTextColor={COLORS.muted}
                                                keyboardType="numeric"
                                            />
                                        </View>
                                    </View>

                                    {/* Notes */}
                                    <View style={styles.fieldFull}>
                                        <Text style={styles.label}>Notes</Text>
                                        <TextInput
                                            style={[styles.input, styles.textarea]}
                                            value={form.notes}
                                            onChangeText={v => updateForm('notes', v)}
                                            placeholder="Short notes about the session..."
                                            placeholderTextColor={COLORS.muted}
                                            multiline
                                            numberOfLines={3}
                                        />
                                    </View>
                                </ScrollView>

                                {/* Actions */}
                                <View style={styles.modalActions}>
                                    <TouchableOpacity
                                        style={styles.cancelBtn}
                                        onPress={closeModal}
                                    >
                                        <Text style={styles.cancelText}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity onPress={handleSave}>
                                        <LinearGradient
                                            colors={GRADIENTS.button}
                                            style={styles.saveBtn}
                                        >
                                            <Text style={styles.saveText}>Save Session</Text>
                                        </LinearGradient>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </Modal>
                </View>
            </ScreenWrapper>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
    },
    list: {
        paddingBottom: 100,
    },

    // ── Swipe Actions ──
    swipeAction: {
        width: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        borderRadius: 12,
    },
    swipeDelete: {
        backgroundColor: COLORS.danger,
    },
    swipeEdit: {
        backgroundColor: '#3b82f6',
    },
    swipeActionButton: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        width: '100%',
    },
    swipeActionText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },

    // ── Session Card ──
    card: {
        width: '100%',
        marginBottom: 12,
        padding: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    cardHeaderLeft: {
        flex: 1,
    },
    locationTitle: {
        color: COLORS.text,
        fontSize: 14,
        fontWeight: '700',
    },
    dateTime: {
        color: COLORS.muted,
        fontSize: 11,
        marginTop: 2,
    },
    profitContainer: {
        alignItems: 'flex-end',
    },
    profitLabel: {
        color: COLORS.muted,
        fontSize: 10,
    },
    profit: {
        fontSize: 16,
        fontWeight: '700',
    },
    infoRow: {
        color: COLORS.muted,
        fontSize: 11,
        marginBottom: 4,
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.04)',
    },
    notes: {
        color: COLORS.accent,
        fontSize: 11,
        flex: 1,
        marginRight: 8,
    },
    swipeHint: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        opacity: 0.5,
    },
    swipeHintText: {
        color: COLORS.muted,
        fontSize: 10,
    },

    // ── Empty State ──
    emptyCard: {
        alignItems: 'center',
        padding: 40,
        marginTop: 40,
    },
    emptyTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 12,
    },
    emptySubtitle: {
        color: COLORS.muted,
        fontSize: 13,
        marginTop: 4,
    },

    // ── Modal ──
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modal: {
        width: '100%',
        maxWidth: 380,
        backgroundColor: '#0c0c0c',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.03)',
        maxHeight: '85%',
    },
    modalTitle: {
        color: COLORS.text,
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        color: COLORS.muted,
        fontSize: 12,
        marginBottom: 16,
    },

    // ── Form ──
    formRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 10,
    },
    field: {
        flex: 1,
    },
    fieldFull: {
        marginBottom: 10,
    },
    label: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        borderRadius: 8,
        padding: 10,
        color: COLORS.text,
        fontSize: 14,
    },
    textarea: {
        minHeight: 60,
        textAlignVertical: 'top',
    },
    dateDisplay: {
        color: COLORS.text,
        fontSize: 14,
    },

    // ── Location Dropdown ──
    suggestions: {
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        backgroundColor: '#1a1a1a',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
        zIndex: 100,
        marginTop: 4,
    },
    suggestionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.04)',
    },
    suggestionText: {
        color: COLORS.text,
        fontSize: 13,
    },

    // ── Game Type Toggle ──
    toggleRow: {
        flexDirection: 'row',
        gap: 0,
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    toggleBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.03)',
    },
    toggleActive: {
        backgroundColor: COLORS.accent,
    },
    toggleText: {
        color: COLORS.muted,
        fontSize: 13,
        fontWeight: '600',
    },
    toggleTextActive: {
        color: '#052018',
    },

    // ── Modal Actions ──
    modalActions: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 16,
    },
    cancelBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
        alignItems: 'center',
    },
    cancelText: {
        color: COLORS.muted,
        fontWeight: '600',
        fontSize: 14,
    },
    saveBtn: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        minWidth: 140,
    },
    saveText: {
        color: '#052018',
        fontWeight: '700',
        fontSize: 14,
    },
});

const enhance = withObservables([], () => ({
    sessions: database.collections.get('sessions').query(Q.sortBy('start_time', Q.desc)),
}));

export default enhance(SessionsPage);
