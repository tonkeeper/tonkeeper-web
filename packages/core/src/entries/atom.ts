export class Subject<T> {
    private subscribers: ((value: T) => void)[] = [];

    public subscribe(fn: (value: T) => void) {
        this.subscribers.push(fn);

        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== fn);
        };
    }

    public next(value: T) {
        this.subscribers.forEach(fn => fn(value));
    }
}

export class Atom<T> {
    private _value: T;

    private subscribers: ((value: T) => void)[] = [];

    get value(): T {
        return this._value;
    }

    constructor(value: T) {
        this._value = value;
    }

    public subscribe(fn: (value: T) => void) {
        this.subscribers.push(fn);

        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== fn);
        };
    }

    public next(value: T) {
        this._value = value;
        this.subscribers.forEach(fn => fn(value));
    }
}

export class ReplaySubject<T> {
    private buffer: T[] = [];

    private subscribers: ((value: T) => void)[] = [];

    private readonly maxBufferSize: number | 'all';

    constructor(bufferSize: number | 'all' = 1) {
        this.maxBufferSize = bufferSize;
    }

    public subscribe(fn: (value: T) => void): () => void {
        this.buffer.forEach(value => fn(value));
        this.subscribers.push(fn);

        return () => {
            this.subscribers = this.subscribers.filter(sub => sub !== fn);
        };
    }

    public next(value: T) {
        this.buffer.push(value);

        if (this.maxBufferSize !== 'all' && this.buffer.length > this.maxBufferSize) {
            this.buffer.splice(0, this.buffer.length - this.maxBufferSize);
        }

        this.subscribers.forEach(fn => fn(value));
    }
}

export const replaySubject = <T>(bufferSize: number | 'all' = 1): ReplaySubject<T> =>
    new ReplaySubject<T>(bufferSize);
export const atom = <T>(value: T): Atom<T> => new Atom<T>(value);
export const subject = <T>(): Subject<T> => new Subject<T>();

export type ReadonlyAtom<T> = Omit<Atom<T>, 'next'>;
export type ReadonlySubject<T> = Omit<Subject<T>, 'next'>;
export type ReadonlyReplaySubject<T> = Omit<ReplaySubject<T>, 'next'>;

export function mapSubject<T, U>(source: Subject<T>, fn: (value: T) => U): Subject<U> {
    const mapped = new Subject<U>();
    source.subscribe(value => mapped.next(fn(value)));
    return mapped;
}

export function mapAtom<T, U>(source: Atom<T>, fn: (value: T) => U): Atom<U> {
    const mapped = new Atom<U>(fn(source.value));
    source.subscribe(value => mapped.next(fn(value)));
    return mapped;
}

export function mapReplaySubject<T, U>(
    source: ReplaySubject<T>,
    fn: (value: T) => U,
    bufferSize: number | 'all' = 1
): ReplaySubject<U> {
    const mapped = new ReplaySubject<U>(bufferSize);
    source.subscribe(value => mapped.next(fn(value)));
    return mapped;
}
