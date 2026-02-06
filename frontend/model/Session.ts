import { Model } from '@nozbe/watermelondb'
import { field, date, readonly, children } from '@nozbe/watermelondb/decorators'

export default class Session extends Model {
    static table = 'sessions'

    @date('start_time') startTime!: Date
    @date('end_time') endTime!: Date | null
    @field('game_type') gameType!: string
    @field('stakes') stakes!: string
    @field('small_blind') smallBlind!: number
    @field('big_blind') bigBlind!: number
    @field('buy_in') buyIn!: number
    @field('cash_out') cashOut!: number
    @field('location') location!: string
    @field('notes') notes!: string
    @readonly @date('created_at') createdAt!: Date
    @readonly @date('updated_at') updatedAt!: Date

    @children('hands') hands!: any

    get profit() {
        return this.cashOut - this.buyIn
    }

    get durationHours() {
        if (!this.endTime) return 0
        // @ts-ignore
        return (this.endTime - this.startTime) / (1000 * 60 * 60)
    }

    get hourlyRate() {
        const hours = this.durationHours
        if (hours === 0) return 0
        return this.profit / hours
    }
}
