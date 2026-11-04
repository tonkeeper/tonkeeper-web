import { PointerEvent, SyntheticEvent, useRef } from 'react';

const LONG_PRESS_MS = 500;

/**
 * Touch long-press with a plain tap fallback, as one set of handlers to
 * spread onto a button. A mouse never arms the press — it has hover and
 * right-click for secondary actions — and a press that fired swallows the
 * click the browser emits after it, so the two actions never run together.
 * Scrolling away cancels the press through `pointerleave` / `pointercancel`.
 */
export const useLongPress = ({
    onClick,
    onLongPress
}: {
    onClick: () => void;
    onLongPress: () => void;
}) => {
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const fired = useRef(false);

    const cancel = () => clearTimeout(timer.current);

    return {
        onClick: () => {
            if (fired.current) {
                fired.current = false;
                return;
            }
            onClick();
        },
        onPointerDown: (e: PointerEvent) => {
            if (e.pointerType === 'mouse') return;
            fired.current = false;
            timer.current = setTimeout(() => {
                fired.current = true;
                onLongPress();
            }, LONG_PRESS_MS);
        },
        onPointerUp: cancel,
        onPointerCancel: cancel,
        onPointerLeave: cancel,
        onContextMenu: (e: SyntheticEvent) => e.preventDefault()
    };
};
