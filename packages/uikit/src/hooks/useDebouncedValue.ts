import { useEffect, useState } from 'react';

/**
 * Trailing-edge debounce for a value that keys a query — a search field
 * typed into character by character would otherwise open a request per
 * keystroke.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);

    useEffect(() => {
        const timeout = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timeout);
    }, [value, delayMs]);

    return debounced;
}
