import api from '../api/client';
import { Session } from '../types';
import NetInfo from '@react-native-community/netinfo';

/**
 * Offline-first sync service
 * Pushes pending sessions to server when online
 */
export class SyncService {
  private isSyncing = false;

  async syncPendingSessions(pendingSessions: Session[]): Promise<string[]> {
    if (this.isSyncing || pendingSessions.length === 0) {
      return [];
    }

    // Check network status
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      return [];
    }

    this.isSyncing = true;
    const syncedIds: string[] = [];

    try {
      const response = await api.post('/sync', {
        client_id: 'mobile',
        changes: pendingSessions.map(session => ({
          type: 'session',
          client_id: session.id,
          data: {
            wallet_id: session.walletId,
            date: session.date,
            location: session.location,
            buyin_cents: session.buyinCents,
            cashout_cents: session.cashoutCents,
            hours: session.hours,
            bb: session.bb,
            tips_cents: session.tipsCents,
            expenses_cents: session.expensesCents,
            notes: session.notes,
          },
        })),
      });

      // Server returns confirmed synced IDs
      if (response.data?.synced) {
        syncedIds.push(...response.data.synced);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }

    return syncedIds;
  }

  async fetchLatestData(): Promise<{ sessions: Session[] }> {
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      throw new Error('No network connection');
    }

    const response = await api.get('/sessions');
    return { sessions: response.data };
  }
}