import { Model, Q } from '@nozbe/watermelondb'

export default class Session extends Model {
    static table = 'sessions'
    static associations = {
        hands: { type: 'has_many', foreignKey: 'session_id' },
    } as const

    // Manual getters/setters to avoid Babel/Decorator conflicts

    get startTime() {
        const raw = (this as any)._getRaw('start_time');
        return raw ? new Date(raw) : null;
    }
    set startTime(val) {
        (this as any)._setRaw('start_time', val ? +new Date(val) : null);
    }

    get endTime() {
        const raw = (this as any)._getRaw('end_time');
        return raw ? new Date(raw) : null;
    }
    set endTime(val) {
        (this as any)._setRaw('end_time', val ? +new Date(val) : null);
    }

    get gameType() { return (this as any)._getRaw('game_type') }
    set gameType(val) { (this as any)._setRaw('game_type', val) }

    get stakes() { return (this as any)._getRaw('stakes') }
    set stakes(val) { (this as any)._setRaw('stakes', val) }

    get smallBlind() { return (this as any)._getRaw('small_blind') }
    set smallBlind(val) { (this as any)._setRaw('small_blind', val) }

    get bigBlind() { return (this as any)._getRaw('big_blind') }
    set bigBlind(val) { (this as any)._setRaw('big_blind', val) }

    get buyIn() { return (this as any)._getRaw('buy_in') }
    set buyIn(val) { (this as any)._setRaw('buy_in', val) }

    get cashOut() { return (this as any)._getRaw('cash_out') }
    set cashOut(val) { (this as any)._setRaw('cash_out', val) }

    get location() { return (this as any)._getRaw('location') }
    set location(val) { (this as any)._setRaw('location', val) }

    get notes() { return (this as any)._getRaw('notes') }
    set notes(val) { (this as any)._setRaw('notes', val) }

    get tips() { return (this as any)._getRaw('tips') }
    set tips(val) { (this as any)._setRaw('tips', val) }

    get expenses() { return (this as any)._getRaw('expenses') }
    set expenses(val) { (this as any)._setRaw('expenses', val) }

    // Readonly dates
    get createdAt() {
        const raw = (this as any)._getRaw('created_at');
        return raw ? new Date(raw) : null;
    }
    get updatedAt() {
        const raw = (this as any)._getRaw('updated_at');
        return raw ? new Date(raw) : null;
    }

    // Children
    get hands() {
        return this.collections.get('hands').query(Q.where('session_id', this.id));
    }

    // Computed properties
    get profit(): number {
        return (this.cashOut || 0) - (this.buyIn || 0)
    }

    get durationHours(): number {
        if (!this.endTime) return 0
        return ((this.endTime as any) - (this.startTime as any)) / (1000 * 60 * 60)
    }

    get hourlyRate(): number {
        const hours = this.durationHours
        if (hours === 0) return 0
        return this.profit / hours
    }
}
