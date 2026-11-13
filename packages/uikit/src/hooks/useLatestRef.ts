import { useRef } from 'react';

/**
 * Holds the value from the latest render. An effect reads values through it when it must run only on
 * its trigger: listing a value that is new on every render (an inline callback, a react-hook-form
 * `field`, a `useMutation` result) as a dependency would restart the effect on every render it causes.
 */
export function useLatestRef<T>(value: T) {
    const ref = useRef(value);
    ref.current = value;
    return ref;
}
