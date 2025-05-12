import { FC, PropsWithChildren, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

function createWrapperAndAppendToBody(wrapperId: string) {
    const wrapperElement = document.createElement('div');
    wrapperElement.setAttribute('id', wrapperId);
    document.body.appendChild(wrapperElement);
    return wrapperElement;
}

const ReactPortal: FC<
    PropsWithChildren<{
        wrapperId?: string;
        position?: 'first' | 'last';
    }>
> = ({ children, wrapperId = 'react-portal-wrapper', position = 'last' }) => {
    const [wrapperElement, setWrapperElement] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        let element = document.getElementById(wrapperId);
        let systemCreated = false;

        if (!element) {
            systemCreated = true;
            element = createWrapperAndAppendToBody(wrapperId);
        }
        setWrapperElement(element);

        return () => {
            /**
             * delete the programmatically created element;
             *
             * make sure
             * <div id="react-portal-modal-container"></div>
             * is added to index.html (Notification.tsx portal root),
             * otherwise html node will be unmounted and it will cause error after ReactRouter navigation
             */
            if (systemCreated && element && element.parentNode) {
                element.parentNode.removeChild(element);
            }
        };
    }, [wrapperId]);

    useLayoutEffect(() => {
        if (!wrapperElement) return;

        if (position === 'first') {
            wrapperElement.prepend(wrapperElement.lastElementChild as Node);
        }
    }, [wrapperElement, position]);

    if (!wrapperElement) return null;

    return createPortal(children, wrapperElement);
};

export default ReactPortal;
