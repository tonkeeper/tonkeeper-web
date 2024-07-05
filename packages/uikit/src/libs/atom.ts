import { useCallback, useEffect, useState } from 'react';

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

export const atom = <T>(value: T): Atom<T> => new Atom<T>(value);
export const subject = <T>(): Subject<T> => new Subject<T>();

export function useAtom<T>(a: Atom<T>): [T, (value: T | ((prev: T) => T)) => void] {
    const [value, setValue] = useState(a.value);

    useEffect(() => {
        setValue(a.value);
        return a.subscribe(v => {
            setValue(v);
        });
    }, [a]);

    const next = useCallback(
        (newValue: T | ((prev: T) => T)) => {
            if (typeof newValue === 'function') {
                newValue = (newValue as (prev: T) => T)(a.value);
            }
            a.next(newValue);
        },
        [a]
    );

    return [value, next];
}
