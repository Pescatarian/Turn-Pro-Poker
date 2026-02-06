import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, relation, json } from '@nozbe/watermelondb/decorators'

const sanitize = (raw: any) => {
    return Array.isArray(raw) ? raw : []
}

export default class Hand extends Model {
    static table = 'hands'

    @relation('sessions', 'session_id') session!: any
    @field('pot') pot!: number
    @field('notes') notes!: string

    @json('cards', sanitize) cards!: any[]
    @json('community_cards', sanitize) communityCards!: any[]
    @json('actions', sanitize) actions!: any[]

    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date
}
