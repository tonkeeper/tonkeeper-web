import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useEffect, useState } from 'react';

export const useFetchNext = (
    hasNextPage: boolean | undefined,
    isFetchingNextPage: boolean,
    fetchNextPage: () => void,
    standalone: boolean,
    ref?: React.RefObject<HTMLDivElement>
) => {
    const [element, setElement] = useState<HTMLDivElement | Window | undefined | null>(
        standalone ? ref?.current : window
    );
    useEffect(() => {
        if (!hasNextPage) return;

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
    }, [hasNextPage, standalone, element]);

    return setElement;
};
