import LokiJSAdapter from '@nozbe/watermelondb/adapters/lokijs'
import schema from './schema'
import migrations from './migrations'

export const adapter = new LokiJSAdapter({
    schema,
    migrations,
    useWebWorker: false,
    useIncrementalIndexedDB: true,
    onSetUpError: (error: any) => {
        console.error('Database setup error:', error)
    }
})
