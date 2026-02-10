import { useState, useEffect } from 'react';
import { database } from '../model';
import Session from '../model/Session';
import { Q } from '@nozbe/watermelondb';

/**
 * Custom hook that extracts unique locations from session history,
 * sorted by frequency (most used first).
 */
export function useLocations(): string[] {
    const [locations, setLocations] = useState<string[]>([]);

    useEffect(() => {
        const loadLocations = async () => {
            const sessions = await database.collections
                .get('sessions')
                .query()
                .fetch() as Session[];

            // Count frequency of each location
            const freq = new Map<string, number>();
            sessions.forEach(s => {
                const loc = (s.location || '').trim();
                if (loc) {
                    freq.set(loc, (freq.get(loc) || 0) + 1);
                }
            });

            // Sort by frequency descending
            const sorted = Array.from(freq.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([loc]) => loc);

            setLocations(sorted);
        };

        loadLocations();

        // Re-fetch when sessions change
        const sub = database.collections.get('sessions').changes.subscribe(() => {
            loadLocations();
        });

        return () => sub.unsubscribe();
    }, []);

    return locations;
}
