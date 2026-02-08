import React, { createContext, useContext, useState, useEffect } from 'react'
// import NetInfo from '@react-native-community/netinfo'
import { sync } from '../sync'

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline'

interface SyncContextType {
    status: SyncStatus
    lastSyncTime: Date | null
    triggerSync: () => Promise<void>
    error: string | null
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
    const [status, setStatus] = useState<SyncStatus>('idle')
    const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isOnline, setIsOnline] = useState(true)

    // Monitor network status
    // useEffect(() => {
    //     const unsubscribe = NetInfo.addEventListener(state => {
    //         const online = state.isConnected && state.isInternetReachable !== false
    //         setIsOnline(online)

    //         if (!online) {
    //             setStatus('offline')
    //         } else if (status === 'offline') {
    //             // Just came back online - trigger sync
    //             triggerSync()
    //         }
    //     })

    //     return () => unsubscribe()
    // }, [status])

    // Auto-sync every 5 minutes when online
    useEffect(() => {
        if (!isOnline) return

        const interval = setInterval(() => {
            triggerSync()
        }, 5 * 60 * 1000) // 5 minutes

        return () => clearInterval(interval)
    }, [isOnline])

    const triggerSync = async () => {
        if (!isOnline) {
            setStatus('offline')
            return
        }

        try {
            setStatus('syncing')
            setError(null)
            await sync()
            setStatus('synced')
            setLastSyncTime(new Date())

            // Reset to idle after 3 seconds
            setTimeout(() => {
                if (status === 'synced') {
                    setStatus('idle')
                }
            }, 3000)
        } catch (err: any) {
            console.error('Sync failed:', err)
            setError(err.message || 'Sync failed')
            setStatus('error')
        }
    }

    return (
        <SyncContext.Provider value={{ status, lastSyncTime, triggerSync, error }}>
            {children}
        </SyncContext.Provider>
    )
}

export function useSync() {
    const context = useContext(SyncContext)
    if (!context) {
        throw new Error('useSync must be used within SyncProvider')
    }
    return context
}
