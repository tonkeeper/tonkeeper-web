import { useEffect, useState } from 'react';
import { usePrevious } from './usePrevious';

export function useCountdown(value: number, options?: { frequencyMS?: number }): number {
    const prevValue = usePrevious(value);
    const [count, setCount] = useState(value < 0 ? 0 : value);
    const frequencyMS = options?.frequencyMS || 1000;

    const shouldComplete = count === 0;

    useEffect(() => {
        if (shouldComplete) {
            return;
        }

        const timer = setInterval(() => {
            setCount(val => val - 1);
        }, frequencyMS);
        return () => clearInterval(timer);
    }, [shouldComplete, frequencyMS]);

    useEffect(() => {
        if (prevValue !== undefined && value !== prevValue) {
            setCount(value < 0 ? 0 : value);
        }
    }, [value, prevValue]);

    return count;
}
