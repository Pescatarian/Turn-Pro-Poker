import { appSchema, tableSchema } from '@nozbe/watermelondb'

export default appSchema({
    version: 3,
    tables: [
        tableSchema({
            name: 'sessions',
            columns: [
                // WatermelonDB automatically adds 'id' (string)
                { name: 'start_time', type: 'number' }, // Timestamps as numbers (ms)
                { name: 'end_time', type: 'number', isOptional: true },
                { name: 'game_type', type: 'string' }, // 'cash' | 'tournament'
                { name: 'stakes', type: 'string' },
                { name: 'small_blind', type: 'number' },
                { name: 'big_blind', type: 'number' },
                { name: 'buy_in', type: 'number' },
                { name: 'cash_out', type: 'number' }, // managed manually usually, but keeping simple
                { name: 'location', type: 'string', isOptional: true },
                { name: 'notes', type: 'string', isOptional: true },
                { name: 'tips', type: 'number', isOptional: true },
                { name: 'expenses', type: 'number', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'hands',
            columns: [
                { name: 'session_id', type: 'string', isIndexed: true },
                { name: 'cards', type: 'string', isOptional: true }, // JSON stringified
                { name: 'community_cards', type: 'string', isOptional: true }, // JSON stringified
                { name: 'actions', type: 'string', isOptional: true }, // JSON stringified
                { name: 'pot', type: 'number' },
                { name: 'notes', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
        tableSchema({
            name: 'transactions',
            columns: [
                { name: 'amount', type: 'number' },
                { name: 'type', type: 'string' }, // 'deposit', 'withdrawal'
                { name: 'notes', type: 'string', isOptional: true },
                { name: 'created_at', type: 'number' },
                { name: 'updated_at', type: 'number' },
            ]
        }),
    ]
})
