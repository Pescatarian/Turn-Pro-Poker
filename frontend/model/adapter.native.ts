import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'
import schema from './schema'
import migrations from './migrations'

export const adapter = new SQLiteAdapter({
    schema,
    migrations,
    jsi: false, // Disabled to avoid Hermes compatibility issues
    onSetUpError: (error: any) => {
        console.error('Database setup error:', error)
    }
})
