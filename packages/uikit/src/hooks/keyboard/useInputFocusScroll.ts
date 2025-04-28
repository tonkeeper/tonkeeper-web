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
    const getScrollProps = (ref: HTMLElement) => {
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
    };

    const handleFocus = useCallback(
        (event: FocusEvent) => {
            if (!scrollContainerRef.current || !scrollOnFocus) return;

            const activeElement = event.target;
            if (!(activeElement instanceof HTMLInputElement)) return;

            const { scrollElement, scrollTo } = getScrollProps(scrollContainerRef.current);

            const rect = activeElement.getBoundingClientRect();
            const containerRect = scrollElement.getBoundingClientRect();

            const keyboardHeight = scrollContainerRef.current.style.paddingBottom
                ? parseInt(scrollContainerRef.current.style.paddingBottom)
                : 0;
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
        [scrollOnFocus, useScrollableParent]
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
        [scrollOnFocus, useScrollableParent]
    );

    const handleKeyboardHide = useCallback(() => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.style.paddingBottom = '0px';
    }, [useScrollableParent]);

    const sdk = useAppSdk();

    useEffect(() => {
        if (!scrollContainerRef.current) return;

        const inputs = scrollContainerRef.current.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('focus', handleFocus);
        });

        const unsubscribeWillShow = sdk.keyboard.willShow.subscribe(handleKeyboardShow);
        const unsubscribeWillHide = sdk.keyboard.willHide.subscribe(handleKeyboardHide);

        return () => {
            inputs.forEach(input => {
                input.removeEventListener('focus', handleFocus);
            });
            unsubscribeWillShow();
            unsubscribeWillHide();
        };
    }, [handleFocus, handleKeyboardShow, handleKeyboardHide, sdk]);
};
