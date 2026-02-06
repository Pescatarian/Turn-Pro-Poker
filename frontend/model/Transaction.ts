import { Model } from '@nozbe/watermelondb'
import { field, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Transaction extends Model {
    static table = 'transactions'

    @field('amount') amount!: number
    @field('type') type!: string // 'deposit' | 'withdrawal'
    @field('notes') notes!: string

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
