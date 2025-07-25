import { useCallback, useEffect, useState } from 'react';
import { Atom, ReadonlyAtom, Subject, ReplySubject } from '@tonkeeper/core/dist/entries/atom';

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

export function useAtomValue<T>(a: ReadonlyAtom<T>): T {
    const [value, setValue] = useState(a.value);

    useEffect(() => {
        setValue(a.value);
        return a.subscribe(v => {
            setValue(v);
        });
    }, [a]);

    return value;
}

export function useSubjectValue<T>(a: Subject<T> | ReplySubject<T>): T | undefined {
    const [value, setValue] = useState<T | undefined>(undefined);

    useEffect(
        () =>
            a.subscribe(v => {
                setValue(v);
            }),
        [a]
    );

    return value;
}
