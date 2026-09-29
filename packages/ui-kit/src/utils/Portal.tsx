import { FC, PropsWithChildren, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portals into a shared `body`-level container, creating it on first use and
 * removing it only if this instance created it — a container the host page
 * declares in its HTML survives route changes.
 */
export const Portal: FC<PropsWithChildren<{ containerId: string }>> = ({
    children,
    containerId
}) => {
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useLayoutEffect(() => {
        let element = document.getElementById(containerId);
        let created = false;

        if (!element) {
            created = true;
            element = document.createElement('div');
            element.id = containerId;
            document.body.appendChild(element);
        }
        setContainer(element);

        return () => {
            if (created) {
                element?.remove();
            }
        };
    }, [containerId]);

    return container ? createPortal(children, container) : null;
};
