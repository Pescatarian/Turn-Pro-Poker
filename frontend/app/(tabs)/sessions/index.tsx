import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Modal, Alert, ScrollView, Platform } from 'react-native';
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
};

const SessionCardComponent = ({
    session,
    onEdit,
    onRemove
}: {
    session: Session;
    onEdit: () => void;
    onRemove: () => void;
}) => {
    const date = new Date(session.startTime);
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    return (
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

            {/* Notes + Actions */}
            <View style={styles.cardFooter}>
                <Text style={styles.notes} numberOfLines={1}>
                    {session.notes || 'No notes'}
                </Text>
                <View style={styles.actions}>
                    <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
                        <Text style={styles.actionText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.actionBtn} onPress={onRemove}>
                        <Text style={styles.actionText}>Remove</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </GlassCard>
    );
};

const SessionCard = withObservables(['session'], ({ session }: { session: Session }) => ({
    session
}))(SessionCardComponent);

const SessionsPage = ({ sessions }: { sessions: Session[] }) => {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const { isOpen, editingSessionId, openAddModal, openEditModal, closeModal } = useSessionModal();
    const [editingSession, setEditingSession] = useState<Session | null>(null);
    const [form, setForm] = useState<SessionFormData>(emptyForm);

    // Sync form when modal opens for editing
    React.useEffect(() => {
        if (isOpen && editingSessionId) {
            const session = sessions.find(s => s.id === editingSessionId);
            if (session) {
                setEditingSession(session);
                const d = new Date(session.startTime);
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
                });
            }
        } else if (isOpen && !editingSessionId) {
            setEditingSession(null);
            setForm(emptyForm);
        }
    }, [isOpen, editingSessionId]); // Removed sessions dependency

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

    const handleEditPress = useCallback((session: Session) => {
        openEditModal(session.id);
    }, [openEditModal]);

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
                    Alert.alert('Error', 'Failed to delete session');
                }
            }
        };

        if (Platform.OS === 'web') {
            // Web: use window.confirm instead of Alert.alert
            if (window.confirm('Are you sure you want to delete this session?')) {
                await doDelete();
            }
        } else {
            // Native: use Alert.alert
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
                    });
                } else {
                    await database.collections.get('sessions').create((s: any) => {
                        s.startTime = startDate;
                        s.endTime = endDate;
                        s.gameType = 'Holdem Cash';
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
            Alert.alert('Error', 'Failed to save session');
        }
    };

    const updateForm = (key: keyof SessionFormData, value: string) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    return (
        <ScreenWrapper
            searchPlaceholder="Search by location, note..."
            searchValue={searchQuery}
            onSearchChange={setSearchQuery}
        >
            <View style={styles.container}>
                {/* Sessions Grid */}
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


                {/* Add Session Modal */}
                <Modal
                    visible={isOpen}
                    animationType="fade"
                    transparent
                    onRequestClose={closeModal}
                >
                    <View style={styles.modalBackdrop}>
                        <View style={styles.modal}>
                            <Text style={styles.modalTitle}>
                                {editingSession ? 'Edit Session' : 'Add Session'}
                            </Text>
                            <Text style={styles.modalSubtitle}>Track your poker session</Text>

                            <ScrollView showsVerticalScrollIndicator={false}>
                                {/* Date | Location */}
                                <View style={styles.formRow}>
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Date</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={form.date}
                                            onChangeText={v => updateForm('date', v)}
                                            placeholder="YYYY-MM-DD"
                                            placeholderTextColor={COLORS.muted}
                                        />
                                    </View>
                                    <View style={styles.field}>
                                        <Text style={styles.label}>Location</Text>
                                        <TextInput
                                            style={styles.input}
                                            value={form.location}
                                            onChangeText={v => updateForm('location', v)}
                                            placeholder="Casino / Site"
                                            placeholderTextColor={COLORS.muted}
                                        />
                                    </View>
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
                    </View>
                </Modal>
            </View>
        </ScreenWrapper>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 12,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 8,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.02)',
    },
    searchIcon: {
        marginRight: 8,
        opacity: 0.75,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 13,
    },
    row: {
        justifyContent: 'space-between',
    },
    list: {
        paddingBottom: 100,
    },
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
    actions: {
        flexDirection: 'row',
        gap: 4,
    },
    actionBtn: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    actionText: {
        color: COLORS.muted,
        fontSize: 10,
        fontWeight: '600',
    },
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
    // Modal Styles
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
