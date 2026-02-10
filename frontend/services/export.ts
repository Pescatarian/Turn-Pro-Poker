import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { database } from '../model';
import Session from '../model/Session';
import { Q } from '@nozbe/watermelondb';

/**
 * Formats a date to YYYY-MM-DD string
 */
function formatDate(date: Date | null): string {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/**
 * Escapes a CSV field value (handles commas, quotes, newlines)
 */
function escapeCSV(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Export all sessions as CSV and open the native share sheet.
 */
export async function exportSessionsCSV(): Promise<{ success: boolean; error?: string }> {
    try {
        const sessions = await database.collections
            .get('sessions')
            .query(Q.sortBy('start_time', Q.asc))
            .fetch() as Session[];

        if (sessions.length === 0) {
            return { success: false, error: 'No sessions to export.' };
        }

        // CSV Header
        const headers = [
            'Date',
            'Location',
            'Game Type',
            'Stakes',
            'Buy-in',
            'Cash-out',
            'Profit',
            'Duration (h)',
            'Hourly Rate',
            'Tips',
            'Expenses',
            'Net Profit',
            'Notes',
        ];

        // CSV Rows
        const rows = sessions.map(s => {
            const profit = s.profit;
            const net = profit - (s.tips || 0) - (s.expenses || 0);
            return [
                escapeCSV(formatDate(s.startTime)),
                escapeCSV(s.location),
                escapeCSV(s.gameType),
                escapeCSV(s.stakes),
                escapeCSV(s.buyIn),
                escapeCSV(s.cashOut),
                escapeCSV(profit.toFixed(2)),
                escapeCSV(s.durationHours.toFixed(1)),
                escapeCSV(s.hourlyRate.toFixed(2)),
                escapeCSV(s.tips || 0),
                escapeCSV(s.expenses || 0),
                escapeCSV(net.toFixed(2)),
                escapeCSV(s.notes),
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');

        // Write to temp file using new expo-file-system API (SDK 54)
        const fileName = `turn-pro-sessions-${formatDate(new Date())}.csv`;
        const file = new File(Paths.cache, fileName);
        file.write(csvContent);

        // Check if sharing is available (not available on all platforms)
        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            return { success: false, error: 'Sharing is not available on this device.' };
        }

        await Sharing.shareAsync(file.uri, {
            mimeType: 'text/csv',
            dialogTitle: 'Export Sessions',
            UTI: 'public.comma-separated-values-text',
        });

        return { success: true };
    } catch (error: any) {
        console.error('CSV export failed:', error);
        return { success: false, error: error.message || 'Export failed.' };
    }
}
