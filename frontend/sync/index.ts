import { synchronize } from '@nozbe/watermelondb/sync'
import { database } from '../model'
import { api } from '../services/api' // We will create this next

export async function sync() {
    await synchronize({
        database,
        pullChanges: async ({ lastPulledAt }: { lastPulledAt: number | null }) => {
            try {
                const response = await api.post('/sync/pull', { last_pulled_at: lastPulledAt })
                const { changes, timestamp } = response.data
                return { changes, timestamp }
            } catch (error) {
                console.error('Pull changes failed:', error)
                throw error
            }
        },
        pushChanges: async ({ changes, lastPulledAt }: { changes: any; lastPulledAt: number }) => {
            try {
                await api.post('/sync/push', {
                    changes,
                    last_pulled_at: lastPulledAt,
                })
            } catch (error) {
                console.error('Push changes failed:', error)
                throw error
            }
        },
        migrationsEnabledAtVersion: 3,
    })
}
