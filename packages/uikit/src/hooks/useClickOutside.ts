import { useEffect, useRef } from 'react';

export function useClickOutside<T extends HTMLElement, A extends HTMLElement = HTMLElement>(
    callback: () => void,
    areaElement?: A | null
) {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        function handleClickOutside(event: Event) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        }
        const element = areaElement || document;

        element.addEventListener('mousedown', handleClickOutside);
        return () => {
            element.removeEventListener('mousedown', handleClickOutside);
        };
    }, [callback, areaElement]);

    return ref;
}
