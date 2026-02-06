import Session from '../model/Session';

// Mock the Model class since we are testing logic, not DB interaction
jest.mock('@nozbe/watermelondb', () => {
    return {
        Model: class Model {
            constructor(values: any) {
                Object.assign(this, values);
            }
        }
    }
});

jest.mock('@nozbe/watermelondb/decorators', () => ({
    field: () => (target: any, key: any) => { },
    date: () => (target: any, key: any) => { },
    readonly: () => (target: any, key: any) => { },
    children: () => (target: any, key: any) => { },
}));

describe('Session Financial Logic', () => {

    it('calculates profit correctly', () => {
        // @ts-ignore
        const session = new Session({} as any);
        Object.assign(session, { buyIn: 200, cashOut: 450 });

        expect(session.profit).toBe(250);
    });

    it('calculates negative profit (loss) correctly', () => {
        // @ts-ignore
        const session = new Session({} as any);
        Object.assign(session, { buyIn: 200, cashOut: 0 });

        expect(session.profit).toBe(-200);
    });

    it('calculates duration in hours correctly', () => {
        const startTime = new Date('2023-01-01T10:00:00');
        const endTime = new Date('2023-01-01T12:30:00'); // 2.5 hours

        // @ts-ignore
        const session = new Session({
            startTime: startTime.getTime(), // WatermelonDB stores as numbers usually, but our model types say Date
            endTime: endTime.getTime(),
        } as any);

        // Our model implementation uses this.endTime - this.startTime. 
        // If the types are Date objects in the class, the subtraction works.
        // If they are timestamps, it also works. 
        // However, our mock passes values directly. 
        // Let's verify Session.ts implementation: `return (this.endTime - this.startTime) ...`
        // We'll pass Date objects to match strict types if needed, or numbers if that's how it behaves at runtime.
        // Given @date decorator, WatermelonDB transforms them. For unit test with mock, we simulate the transformed value.
        // Let's assume we pass numbers or Dates locally.

        Object.assign(session, { startTime: startTime, endTime: endTime });

        expect(session.durationHours).toBe(2.5);
    });

    it('calculates hourly rate correctly', () => {
        const startTime = new Date('2023-01-01T10:00:00');
        const endTime = new Date('2023-01-01T12:00:00'); // 2 hours

        // @ts-ignore
        const session = new Session({} as any);
        Object.assign(session, { buyIn: 200, cashOut: 400, startTime, endTime });

        expect(session.hourlyRate).toBe(100); // 200 / 2
    });

    it('handles zero duration for hourly rate to avoid infinity', () => {
        // @ts-ignore
        const session = new Session({
            buyIn: 200,
            cashOut: 400,
            startTime: new Date(),
            endTime: new Date(), // 0 duration
        } as any);

        expect(session.hourlyRate).toBe(0);
    });
});
