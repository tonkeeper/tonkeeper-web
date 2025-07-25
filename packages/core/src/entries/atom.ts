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

export class ReplySubject<T> {
    private buffer: T[] = [];

    private subscribers: ((value: T) => void)[] = [];

    private readonly maxBufferSize: number | 'all';

    constructor(bufferSize: number | 'all' = 1) {
        this.maxBufferSize = bufferSize;
    }

    public subscribe(fn: (value: T) => void): () => void {
        this.buffer.forEach(fn);
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

export const replySubject = <T>(bufferSize: number | 'all' = 1): ReplySubject<T> =>
    new ReplySubject<T>(bufferSize);
export const atom = <T>(value: T): Atom<T> => new Atom<T>(value);
export const subject = <T>(): Subject<T> => new Subject<T>();

export type ReadonlyAtom<T> = Omit<Atom<T>, 'next'>;
export type ReadonlySubject<T> = Omit<Subject<T>, 'next'>;
export type ReadonlyReplySubject<T> = Omit<ReplySubject<T>, 'next'>;
