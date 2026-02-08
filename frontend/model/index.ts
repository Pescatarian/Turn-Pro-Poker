import { Database } from '@nozbe/watermelondb'
import { adapter } from './adapter'

import Session from './Session'
import Hand from './Hand'
import Transaction from './Transaction'

export const database = new Database({
    adapter,
    modelClasses: [
        Session,
        Hand,
        Transaction,
    ],
})
