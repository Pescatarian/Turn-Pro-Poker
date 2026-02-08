import { createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations'

export default schemaMigrations({
    migrations: [
        {
            toVersion: 3,
            steps: [
                createTable({
                    name: 'hands',
                    columns: [
                        { name: 'session_id', type: 'string', isIndexed: true },
                        { name: 'cards', type: 'string', isOptional: true },
                        { name: 'community_cards', type: 'string', isOptional: true },
                        { name: 'actions', type: 'string', isOptional: true },
                        { name: 'pot', type: 'number' },
                        { name: 'notes', type: 'string', isOptional: true },
                        { name: 'created_at', type: 'number' },
                        { name: 'updated_at', type: 'number' },
                    ],
                }),
            ],
        },
    ],
})
