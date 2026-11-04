import { useEffect, useCallback, RefObject } from 'react';
import { useAppSdk } from '../appSdk';

export const findClosestScrollableElement = (element: HTMLElement) => {
    let container = element;
    let scrollElement = container;

    let current = element;
    while (current && current.parentElement) {
        if (current.tagName === 'ION-CONTENT') {
            container = current;
            scrollElement = current.shadowRoot?.querySelector('.inner-scroll') ?? current;
            break;
        }
        const style = getComputedStyle(current);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll') {
            container = current;
            scrollElement = current;
            break;
        }
        current = current.parentElement;
    }

    const scrollTo = (newScrollTop: number) => {
        if (container.tagName === 'ION-CONTENT') {
            (container as HTMLIonContentElement).scrollToPoint(0, newScrollTop, 300);
        } else {
            container.scrollTo({
                top: newScrollTop,
                behavior: 'smooth'
            });
        }
    };
    return { scrollElement, scrollTo };
};

export const useInputFocusScroll = (
    scrollContainerRef: RefObject<HTMLElement>,
    { scrollOnFocus = true, useScrollableParent = true } = {}
) => {
    const getScrollProps = useCallback(
        (ref: HTMLElement) => {
            let scrollElement: HTMLElement;
            let scrollTo: (pos: number) => void;
            if (useScrollableParent && ref) {
                const scl = findClosestScrollableElement(ref);
                scrollElement = scl.scrollElement;
                scrollTo = scl.scrollTo;
            } else {
                scrollElement = ref;
                scrollTo = (pos: number) => ref.scrollTo({ top: pos, behavior: 'smooth' });
            }
            return { scrollElement, scrollTo };
        },
        [useScrollableParent]
    );

    const handleFocus = useCallback(
        (event: FocusEvent) => {
            if (!scrollContainerRef.current || !scrollOnFocus) return;

            const activeElement = event.target;
            if (!(activeElement instanceof HTMLInputElement)) return;

            // Without an on-screen keyboard the browser already scrolls the
            // focused input into view; the offset math below assumes the
            // viewport is shortened by the keyboard and, applied to a modal
            // scroll area on desktop, yields a negative target that jumps
            // the form to the top.
            const keyboardHeight = scrollContainerRef.current.style.paddingBottom
                ? parseInt(scrollContainerRef.current.style.paddingBottom)
                : 0;
            if (keyboardHeight === 0) return;

            const { scrollElement, scrollTo } = getScrollProps(scrollContainerRef.current);

            const rect = activeElement.getBoundingClientRect();
            const containerRect = scrollElement.getBoundingClientRect();

            const visibleScreenHeight = window.innerHeight - keyboardHeight;
            const elementTopRelativeToContainer = rect.top - containerRect.top;

            const newScrollTop =
                scrollElement.scrollTop +
                elementTopRelativeToContainer +
                rect.height -
                visibleScreenHeight +
                240;

            scrollTo(newScrollTop);
        },
        [scrollOnFocus, scrollContainerRef, getScrollProps]
    );

    const handleKeyboardShow = useCallback(
        async (info: { keyboardHeight: number }) => {
            if (!scrollContainerRef.current) return;

            const { scrollElement, scrollTo } = getScrollProps(scrollContainerRef.current);

            const keyboardHeight = info.keyboardHeight;
            scrollContainerRef.current.style.paddingBottom = `${keyboardHeight + 16}px`;

            if (scrollOnFocus && document.activeElement) {
                const activeElement = document.activeElement;
                if (!(activeElement instanceof HTMLInputElement)) return;

                const rect = activeElement.getBoundingClientRect();
                const containerRect = scrollElement.getBoundingClientRect();

                const visibleScreenHeight = window.innerHeight - keyboardHeight;
                const elementTopRelativeToContainer = rect.top - containerRect.top;

                const newScrollTop =
                    scrollElement.scrollTop +
                    elementTopRelativeToContainer +
                    rect.height -
                    visibleScreenHeight +
                    240;

                scrollTo(newScrollTop);
            }
        },
        [scrollOnFocus, scrollContainerRef, getScrollProps]
    );

    const handleKeyboardHide = useCallback(() => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.style.paddingBottom = '0px';
    }, [scrollContainerRef]);

    const sdk = useAppSdk();

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        // Delegated so inputs mounted later (e.g. the 12 → 24 word toggle)
        // are covered without re-subscribing.
        container.addEventListener('focusin', handleFocus);

        const unsubscribeWillShow = sdk.keyboard.willShow.subscribe(handleKeyboardShow);
        const unsubscribeWillHide = sdk.keyboard.willHide.subscribe(handleKeyboardHide);

        return () => {
            container.removeEventListener('focusin', handleFocus);
            unsubscribeWillShow();
            unsubscribeWillHide();
        };
    }, [handleFocus, handleKeyboardShow, handleKeyboardHide, sdk, scrollContainerRef]);
};
