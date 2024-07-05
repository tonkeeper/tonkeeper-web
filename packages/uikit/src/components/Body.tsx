import { TargetEnv } from '@tonkeeper/core/dist/AppSdk';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import React, { PropsWithChildren, useLayoutEffect, useRef, useState } from 'react';
import styled, { css } from 'styled-components';
import { AppSelectionContext, useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';

const BodyElement = styled.div<{ targetEnv: TargetEnv }>`
    flex-grow: 1;
    padding: 0 1rem;
    -webkit-overflow-scrolling: touch;
    background-color: ${props => props.theme.backgroundPage};

    ${p =>
        p.targetEnv === 'twa' &&
        css`
            height: 100%;
            overflow: auto;
        `}

    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            overflow: auto;
        `}
`;

const setTop = () => {
    if (!document.body.classList.contains('top')) {
        document.body.classList.add('top');
    }
};
const removeTop = () => {
    if (document.body.classList.contains('top')) {
        document.body.classList.remove('top');
    }
};

const setBottom = () => {
    if (!document.body.classList.contains('bottom')) {
        document.body.classList.add('bottom');
    }
};
const removeBottom = () => {
    if (document.body.classList.contains('bottom')) {
        document.body.classList.remove('bottom');
    }
};

export const useWindowsScroll = (addHidden = true) => {
    const sdk = useAppSdk();
    const { standalone, ios } = useAppContext();
    useLayoutEffect(() => {
        if (standalone) {
            if (addHidden) {
                document.documentElement.classList.add('hidden');
            }
            return;
        }

        let timer: NodeJS.Timeout | undefined;

        const handler = throttle(() => {
            if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 10) {
                setBottom();
            } else {
                removeBottom();
            }
            if (window.scrollY > 10) {
                removeTop();
            } else {
                setTop();
            }

            if (ios) return;
            clearTimeout(timer);
            if (!document.body.classList.contains('disable-hover')) {
                document.body.classList.add('disable-hover');
            }
            timer = setTimeout(function () {
                document.body.classList.remove('disable-hover');
            }, 500);
        }, 50);

        window.addEventListener('scroll', handler);
        sdk.uiEvents.on('loading', handler);

        handler();

        return () => {
            setTop();
            setBottom();
            window.removeEventListener('scroll', handler);
            sdk.uiEvents.off('loading', handler);
        };
    }, [standalone]);
};

export const useAppSelection = (elementRef: React.MutableRefObject<HTMLDivElement | null>) => {
    const [selection, setSelection] = useState<EventTarget | null>(null);

    useLayoutEffect(() => {
        const element = elementRef.current;
        if (!element) return;

        let timer: NodeJS.Timeout | undefined = undefined;
        const scrollTimer: NodeJS.Timeout | undefined = undefined;

        const handlerTouchUp = () => {
            clearTimeout(timer);
            setSelection(null);
        };

        const handlerTouchStart = (ev: TouchEvent) => {
            if (ev.touches.length > 1) return;
            timer = setTimeout(() => {
                setSelection(ev.target);
            }, 100);
        };

        const handlerTouchMove = throttle(() => {
            handlerTouchUp();
        }, 50);

        window.addEventListener('touchstart', handlerTouchStart);
        window.addEventListener('touchmove', handlerTouchMove);
        window.addEventListener('touchend', handlerTouchUp);
        window.addEventListener('touchcancel', handlerTouchUp);

        return () => {
            clearTimeout(scrollTimer);
            clearTimeout(timer);
            window.removeEventListener('touchstart', handlerTouchStart);
            window.removeEventListener('touchmove', handlerTouchMove);
            window.removeEventListener('touchend', handlerTouchUp);
            window.removeEventListener('touchcancel', handlerTouchUp);
        };
    }, [elementRef]);

    return selection;
};

export const InnerBody = React.forwardRef<
    HTMLDivElement,
    PropsWithChildren & { className?: string }
>(({ children, className }, ref) => {
    const sdk = useAppSdk();
    const { standalone } = useAppContext();

    const innerRef = useRef<HTMLDivElement>(null);

    const elementRef = (
        ref == null ? innerRef : ref
    ) as React.MutableRefObject<HTMLDivElement | null>;

    useLayoutEffect(() => {
        const element = elementRef.current;
        if (!element) return;
        if (!standalone) return;

        let timer: NodeJS.Timeout | undefined;

        const handlerScroll = throttle(() => {
            if (element.scrollTop < 10) {
                setTop();
            } else {
                removeTop();
            }
            if (element.scrollTop + element.clientHeight < element.scrollHeight - 10) {
                removeBottom();
            } else {
                setBottom();
            }
            clearTimeout(timer);
            if (!document.body.classList.contains('scroll')) {
                document.body.classList.add('scroll');
            }
            timer = setTimeout(function () {
                document.body.classList.remove('scroll');
            }, 300);

            sdk.twaExpand && sdk.twaExpand();
        }, 50);

        element.addEventListener('scroll', handlerScroll);
        sdk.uiEvents.on('loading', handlerScroll);

        handlerScroll();

        return () => {
            setTop();
            setBottom();
            clearTimeout(timer);
            sdk.uiEvents.off('loading', handlerScroll);

            element.removeEventListener('scroll', handlerScroll);
        };
    }, [elementRef]);

    const selection = useAppSelection(elementRef);
    const id = standalone ? 'body' : undefined;

    return (
        <BodyElement ref={elementRef} id={id} className={className} targetEnv={sdk.targetEnv}>
            <AppSelectionContext.Provider value={selection}>
                {children}
            </AppSelectionContext.Provider>
        </BodyElement>
    );
});

InnerBody.displayName = 'InnerBody';
