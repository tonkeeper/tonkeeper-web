import { useEffect, useRef } from 'react';

export const useInputRefAutoFocus = (delay = 0) => {
    const ref = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (ref.current) {
                ref.current.focus();
            }
        }, delay);

        return () => {
            clearTimeout(timer);
        };
    }, [ref]);

    return ref;
};
