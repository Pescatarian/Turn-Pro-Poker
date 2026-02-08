import { Model } from '@nozbe/watermelondb'

export default class Transaction extends Model {
    static table = 'transactions'

    // Manual getters/setters to avoid Babel/Decorator conflicts

    get amount() { return (this as any)._getRaw('amount') }
    set amount(val) { (this as any)._setRaw('amount', val) }

    get type() { return (this as any)._getRaw('type') }
    set type(val) { (this as any)._setRaw('type', val) }

    get notes() { return (this as any)._getRaw('notes') }
    set notes(val) { (this as any)._setRaw('notes', val) }

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
