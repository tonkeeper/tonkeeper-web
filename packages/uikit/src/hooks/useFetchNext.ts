import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect } from 'react';

export const useFetchNext = (
    hasNextPage: boolean | undefined,
    isFetchingNextPage: boolean,
    fetchNextPage: () => void,
    standalone: boolean,
    ref?: React.RefObject<HTMLDivElement>
) => {
    useEffect(() => {
        if (!hasNextPage) return;

        const element = standalone ? ref?.current : window;

        if (!element) return;

        const handler = throttle(() => {
            if (isFetchingNextPage) return;
            if (document.documentElement.className === 'is-locked') return;

            if (element === window) {
                if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
                    fetchNextPage();
                }
            } else {
                const item = element as HTMLDivElement;
                if (item.scrollTop >= item.scrollHeight - window.innerHeight - 500) {
                    fetchNextPage();
                }
            }
        }, 50);

        element.addEventListener('scroll', handler);

        handler();

        return () => {
            element.removeEventListener('scroll', handler);
        };
    }, [hasNextPage, standalone, ref]);
};
