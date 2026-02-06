// Mock dependencies BEFORE importing the module under test
jest.mock('../model', () => ({
    database: {},
}));

// Create mock function for API
const mockPost = jest.fn();
jest.mock('../services/api', () => ({
    api: {
        post: (url: string, data: any) => mockPost(url, data),
    },
}));

// Mock synchronize to capture the config
type SyncConfig = {
    database: any;
    pullChanges: (params: { lastPulledAt: number | null }) => Promise<{ changes: any; timestamp: number }>;
    pushChanges: (params: { changes: any; lastPulledAt: number }) => Promise<void>;
    migrationsEnabledAtVersion: number;
};

let capturedConfig: SyncConfig | null = null;

jest.mock('@nozbe/watermelondb/sync', () => ({
    synchronize: jest.fn((config: SyncConfig) => {
        capturedConfig = config;
        return Promise.resolve();
    }),
}));

// Import the module under test AFTER mocks are set up
import { sync } from '../sync';
import { synchronize } from '@nozbe/watermelondb/sync';

describe('Sync Adapter', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        capturedConfig = null;
    });

    it('calls synchronize with the correct configuration', async () => {
        await sync();

        expect(synchronize).toHaveBeenCalledTimes(1);
        expect(capturedConfig).not.toBeNull();
        expect(capturedConfig).toHaveProperty('database');
        expect(capturedConfig).toHaveProperty('pullChanges');
        expect(capturedConfig).toHaveProperty('pushChanges');
        expect(capturedConfig?.migrationsEnabledAtVersion).toBe(1);
    });

    describe('pullChanges', () => {
        it('calls the API with the correct endpoint and payload', async () => {
            const mockChanges = { sessions: { created: [], updated: [], deleted: [] } };
            const mockTimestamp = Date.now();

            mockPost.mockResolvedValueOnce({
                data: { changes: mockChanges, timestamp: mockTimestamp },
            });

            await sync();

            const result = await capturedConfig!.pullChanges({ lastPulledAt: 1234567890 });

            expect(mockPost).toHaveBeenCalledWith('/sync/pull', { last_pulled_at: 1234567890 });
            expect(result.changes).toEqual(mockChanges);
            expect(result.timestamp).toEqual(mockTimestamp);
        });

        it('handles null lastPulledAt for initial sync', async () => {
            mockPost.mockResolvedValueOnce({
                data: { changes: {}, timestamp: Date.now() },
            });

            await sync();
            await capturedConfig!.pullChanges({ lastPulledAt: null });

            expect(mockPost).toHaveBeenCalledWith('/sync/pull', { last_pulled_at: null });
        });
    });

    describe('pushChanges', () => {
        it('calls the API with the correct endpoint and payload', async () => {
            const mockChanges = {
                sessions: { created: [{ id: 'abc' }], updated: [], deleted: [] },
            };
            const lastPulledAt = 1234567890;

            mockPost.mockResolvedValueOnce({ data: {} });

            await sync();
            await capturedConfig!.pushChanges({ changes: mockChanges, lastPulledAt });

            expect(mockPost).toHaveBeenCalledWith('/sync/push', {
                changes: mockChanges,
                last_pulled_at: lastPulledAt,
            });
        });
    });

    describe('Error Handling', () => {
        it('throws error when pullChanges fails', async () => {
            const networkError = new Error('Network Error');
            mockPost.mockRejectedValueOnce(networkError);

            await sync();

            await expect(capturedConfig!.pullChanges({ lastPulledAt: null })).rejects.toThrow('Network Error');
        });

        it('throws error when pushChanges fails', async () => {
            const networkError = new Error('Network Error');
            mockPost.mockRejectedValueOnce(networkError);

            await sync();

            await expect(
                capturedConfig!.pushChanges({ changes: {}, lastPulledAt: 123 })
            ).rejects.toThrow('Network Error');
        });
    });
});

