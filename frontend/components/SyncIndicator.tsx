import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useSync } from '../contexts/SyncContext'

export function SyncIndicator() {
    const { status, lastSyncTime, triggerSync, error } = useSync()

    const getStatusConfig = () => {
        switch (status) {
            case 'syncing':
                return {
                    icon: 'sync' as const,
                    color: '#3b82f6',
                    text: 'Syncing...',
                    spinning: true,
                }
            case 'synced':
                return {
                    icon: 'checkmark-circle' as const,
                    color: '#10b981',
                    text: 'Synced',
                    spinning: false,
                }
            case 'error':
                return {
                    icon: 'warning' as const,
                    color: '#ef4444',
                    text: error || 'Sync failed',
                    spinning: false,
                }
            case 'offline':
                return {
                    icon: 'cloud-offline' as const,
                    color: '#6b7280',
                    text: 'Offline',
                    spinning: false,
                }
            default:
                return {
                    icon: 'cloud-done' as const,
                    color: '#6b7280',
                    text: lastSyncTime
                        ? `Synced ${formatRelativeTime(lastSyncTime)}`
                        : 'Not synced',
                    spinning: false,
                }
        }
    }

    const config = getStatusConfig()

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={triggerSync}
            disabled={status === 'syncing' || status === 'offline'}
        >
            <Ionicons name={config.icon} size={16} color={config.color} />
            <Text style={[styles.text, { color: config.color }]}>{config.text}</Text>
        </TouchableOpacity>
    )
}

function formatRelativeTime(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    return `${Math.floor(seconds / 86400)}d ago`
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    text: {
        fontSize: 12,
        fontWeight: '500',
    },
})
