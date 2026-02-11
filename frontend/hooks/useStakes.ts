import { useState, useEffect } from 'react';
import { database } from '../model';
import Session from '../model/Session';

/**
 * Custom hook that extracts unique stakes from session history,
 * sorted by frequency (most used first).
 */
export function useStakes(): string[] {
    const [stakes, setStakes] = useState<string[]>([]);

    useEffect(() => {
        const loadStakes = async () => {
            const sessions = await database.collections
                .get('sessions')
                .query()
                .fetch() as Session[];

            // Count frequency of each stake
            const freq = new Map<string, number>();
            sessions.forEach(s => {
                const st = (s.stakes || '').trim();
                if (st) {
                    freq.set(st, (freq.get(st) || 0) + 1);
                }
            });

            // Sort by frequency descending
            const sorted = Array.from(freq.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([st]) => st);

            setStakes(sorted);
        };

        loadStakes();

        // Re-fetch when sessions change
        const sub = database.collections.get('sessions').changes.subscribe(() => {
            loadStakes();
        });

        return () => sub.unsubscribe();
    }, []);

    return stakes;
}
