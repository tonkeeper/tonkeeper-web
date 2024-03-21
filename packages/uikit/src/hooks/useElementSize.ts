import { MutableRefObject, useCallback, useRef, useState } from 'react';
import { useResizeObserver } from './useResizeObserver';

interface Size {
    width: number;
    height: number;
}

interface ScrollSize {
    scrollWidth: number;
    scrollHeight: number;
}

export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
    MutableRefObject<T | null>,
    Size & ScrollSize
] {
    const ref = useRef<T | null>(null);
    const [size, setSize] = useState<Size & ScrollSize>({
        width: 0,
        height: 0,
        scrollWidth: 0,
        scrollHeight: 0
    });

    const onResize = useCallback(() => {
        setSize({
            width: ref.current?.offsetWidth || 0,
            height: ref.current?.offsetHeight || 0,
            scrollWidth: ref.current?.scrollWidth || 0,
            scrollHeight: ref.current?.scrollHeight || 0
        });
    }, []);

    useResizeObserver({ ref, onResize });

    return [ref, size];
}
