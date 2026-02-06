import { Database } from '@nozbe/watermelondb'
import { Platform } from 'react-native'
import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'

import schema from './schema'
import Session from './Session'
import Hand from './Hand'
import Transaction from './Transaction'

// Use LokiJS adapter for web platform
// For native (iOS/Android), you would use SQLiteAdapter with native modules
const adapter = new LokiJSAdapter({
    schema,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: any) => {
        console.error('Database setup error:', error)
    }
})

export const database = new Database({
    adapter,
    modelClasses: [
        Session,
        Hand,
        Transaction,
    ],
})
