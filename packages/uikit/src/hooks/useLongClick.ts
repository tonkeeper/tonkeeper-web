import { useState, useEffect, useCallback } from 'react';

export function useLongClick<T extends unknown[]>(callback: (...args: T) => void, ms = 300) {
    const [startLongPress, setStartLongPress] = useState<T | undefined>(undefined);

    useEffect(() => {
        let timerId: ReturnType<typeof setTimeout>;
        if (startLongPress) {
            timerId = setTimeout(() => callback(...startLongPress), ms);
        }

        return () => {
            clearTimeout(timerId);
        };
    }, [callback, ms, startLongPress]);

    const start = useCallback((...args: T) => {
        setStartLongPress(args);
    }, []);
    const stop = useCallback(() => {
        setStartLongPress(undefined);
    }, []);

    return {
        onMouseDown: start,
        onMouseUp: stop,
        onMouseLeave: stop,
        onTouchStart: start,
        onTouchEnd: stop
    };
}
