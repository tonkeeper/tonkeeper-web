import React, { lazy, Suspense, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const GiftTradingLab = lazy(() => import('./GiftTradingLab'));

export function isLoopbackGiftTradingPage({ protocol, hostname }: Pick<Location, 'protocol' | 'hostname'>) {
    return (
        (protocol === 'http:' || protocol === 'https:') &&
        (hostname === 'localhost' || hostname === '127.0.0.1')
    );
}

function GiftTradingDialog({ onClose }: { onClose: () => void }) {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useLayoutEffect(() => {
        const dialog = dialogRef.current;
        dialog?.showModal();
        return () => dialog?.close();
    }, []);

    return createPortal(
        <dialog
            ref={dialogRef}
            aria-label="Gift trading local test"
            className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none border-0 bg-backgroundPage p-4 text-textPrimary"
            onCancel={event => {
                event.preventDefault();
                onClose();
            }}
        >
            <Suspense fallback={<button type="button" onClick={onClose}>Back to gifts</button>}>
                <GiftTradingLab onClose={onClose} />
            </Suspense>
        </dialog>,
        document.body
    );
}

export default function GiftTradingEntry() {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button
                type="button"
                className="my-2 min-h-11 rounded-medium bg-buttonSecondaryBackground px-4 text-buttonSecondaryForeground"
                onClick={() => setIsOpen(true)}
            >
                Open synthetic gift trading
            </button>
            {isOpen && <GiftTradingDialog onClose={() => setIsOpen(false)} />}
        </>
    );
}
