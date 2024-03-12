import { useLayoutEffect, useRef, useState } from 'react';
import { throttle } from '@tonkeeper/core/dist/utils/common';

export function useIsScrolled<T extends HTMLElement = HTMLDivElement>(options?: {
    gapTop: number;
    gapBottom: number;
}) {
    const gapTop = options?.gapTop ?? 10;
    const gapBottom = options?.gapBottom ?? 10;
    const ref = useRef<T | null>(null);
    const [closeTop, setCloseTop] = useState(true);
    const [closeBottom, setCloseBottom] = useState(false);

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        let timer: NodeJS.Timeout | undefined;

        const handlerScroll = throttle(() => {
            setCloseTop(element.scrollTop < gapTop);
            setCloseBottom(
                element.scrollTop + element.clientHeight < element.scrollHeight - gapBottom
            );

            clearTimeout(timer);
            if (!document.body.classList.contains('scroll')) {
                document.body.classList.add('scroll');
            }
            timer = setTimeout(function () {
                document.body.classList.remove('scroll');
            }, 300);
        }, 50);

        element.addEventListener('scroll', handlerScroll);
        handlerScroll();

        return () => {
            clearTimeout(timer);

            element.removeEventListener('scroll', handlerScroll);
        };
    }, []);

    return { ref, closeTop, closeBottom };
}
