import { FC, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { useTranslation } from '../../../../hooks/translation';

const AUTO_HIDE_MS = 5000;

/**
 * Touch counterpart of the desktop disconnect modal, mirroring the native
 * iOS `DisconnectDappToast`: a card floated at the top of the screen with
 * the "Disconnect X?" question and a red action that disconnects
 * immediately. Auto-hides if the user doesn't act.
 */
export const DisconnectAppToast: FC<{
    appName: string;
    onDisconnect: () => void;
    onClose: () => void;
}> = ({ appName, onDisconnect, onClose }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const timer = setTimeout(onClose, AUTO_HIDE_MS);
        return () => clearTimeout(timer);
    }, [onClose]);

    return createPortal(
        <div
            role="alert"
            className="fixed inset-x-4 top-[calc(env(safe-area-inset-top)+8px)] z-50 mx-auto flex max-w-[358px] items-center gap-5 rounded-2xl bg-backgroundContent px-5 py-[18px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.04)]"
        >
            <span className="min-w-0 flex-1 text-body2 text-textPrimary">
                {t('connect_disconnect_confirm_title', { name: appName })}
            </span>
            <button
                type="button"
                onClick={onDisconnect}
                className="shrink-0 text-label2 text-accentRed"
            >
                {t('disconnect')}
            </button>
        </div>,
        document.body
    );
};
