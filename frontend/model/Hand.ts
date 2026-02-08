import { Model, Relation } from '@nozbe/watermelondb'

export default class Hand extends Model {
    static table = 'hands'
    static associations = {
        sessions: { type: 'belongs_to', key: 'session_id' },
    } as const

    // Manual getters/setters to avoid Babel/Decorator conflicts

    // Relation: @relation('sessions', 'session_id')
    get session() {
        const model = this as any;
        model._relationCache = model._relationCache || {};
        if (model._relationCache['session']) return model._relationCache['session'];

        const newRelation = new Relation(this, 'sessions', 'session_id', { isImmutable: false });
        model._relationCache['session'] = newRelation;
        return newRelation;
    }

    get pot() { return (this as any)._getRaw('pot') }
    set pot(val) { (this as any)._setRaw('pot', val) }

    get notes() { return (this as any)._getRaw('notes') }
    set notes(val) { (this as any)._setRaw('notes', val) }

    // Internal JSON helpers
    get _cards() { return (this as any)._getRaw('cards') }
    set _cards(val) { (this as any)._setRaw('cards', val) }

    get _communityCards() { return (this as any)._getRaw('community_cards') }
    set _communityCards(val) { (this as any)._setRaw('community_cards', val) }

    get _actions() { return (this as any)._getRaw('actions') }
    set _actions(val) { (this as any)._setRaw('actions', val) }

    // Parsed JSON properties (same logic as before)
    get cards(): any[] {
        try { return JSON.parse(this._cards || '[]') } catch { return [] }
    }
    set cards(value: any[]) {
        this._cards = JSON.stringify(value)
    }

    get communityCards(): any[] {
        try { return JSON.parse(this._communityCards || '[]') } catch { return [] }
    }
    set communityCards(value: any[]) {
        this._communityCards = JSON.stringify(value)
    }

    get actions(): any[] {
        try { return JSON.parse(this._actions || '[]') } catch { return [] }
    }
    set actions(value: any[]) {
        this._actions = JSON.stringify(value)
    }

    // Readonly dates
    get createdAt() {
        const raw = (this as any)._getRaw('created_at');
        return raw ? new Date(raw) : null;
    }
    get updatedAt() {
        const raw = (this as any)._getRaw('updated_at');
        return raw ? new Date(raw) : null;
    }
}
