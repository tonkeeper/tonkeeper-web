import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

/**
 * Returns a ref setter to be attached to a sentinel element at the bottom of
 * the paginated list. When the sentinel comes within 500px of the viewport,
 * `fetchNextPage` is called.
 *
 * Uses IntersectionObserver with root=null (viewport), which works across:
 *  - Window scrolling (mobile web, browser extension popup-less views)
 *  - `overflow: auto` containers (mobile PWA InnerBody, desktop/extension views)
 *  - Ionic IonContent (slotted content moves relative to viewport as the inner
 *    scroll container scrolls)
 *  - Electron renderer
 */
export const useFetchNext = (
    hasNextPage: boolean | undefined,
    isFetchingNextPage: boolean,
    fetchNextPage: () => void
) => {
    const [sentinel, setSentinel] = useState<Element | null>(null);

    const isFetchingNextPageRef = useRef(isFetchingNextPage);
    const fetchNextPageRef = useRef(fetchNextPage);
    useEffect(() => {
        isFetchingNextPageRef.current = isFetchingNextPage;
        fetchNextPageRef.current = fetchNextPage;
    }, [isFetchingNextPage, fetchNextPage]);

    useEffect(() => {
        if (!hasNextPage || !sentinel) return;

        const observer = new IntersectionObserver(
            entries => {
                if (document.documentElement.classList.contains('is-locked')) return;
                if (isFetchingNextPageRef.current) return;
                if (entries.some(e => e.isIntersecting)) {
                    // Flip the guard synchronously so a second IO callback fired
                    // before React commits `isFetchingNextPage=true` can't double-fire.
                    isFetchingNextPageRef.current = true;
                    fetchNextPageRef.current();
                }
            },
            {
                root: null,
                rootMargin: '0px 0px 500px 0px',
                threshold: 0
            }
        );

        observer.observe(sentinel);

        return () => observer.disconnect();
    }, [hasNextPage, sentinel]);

    return setSentinel as Dispatch<SetStateAction<HTMLElement | null>>;
};
