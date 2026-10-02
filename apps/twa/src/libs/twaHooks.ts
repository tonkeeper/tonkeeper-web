import { useBackButton } from '@tma.js/sdk-react';
import { useEffect } from 'react';

export const useHandleBackButton = (handleClose: () => void, enabled = true) => {
    const backButton = useBackButton();

    useEffect(() => {
        if (!enabled) {
            // Root screen: let Telegram show its default close/minimize control.
            backButton.hide();
            return undefined;
        }
        backButton.show();
        backButton.on('click', handleClose);
        return () => {
            backButton.off('click', handleClose);
            backButton.hide();
        };
    }, [handleClose, backButton, enabled]);
};
