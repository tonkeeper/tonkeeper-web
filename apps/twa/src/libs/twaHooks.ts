import { useBackButton } from '@tma.js/sdk-react';
import { useEffect } from 'react';

export const useHandleBackButton = (handleClose: () => void) => {
    const backButton = useBackButton();

    useEffect(() => {
        backButton.show();
        backButton.on('click', handleClose);
        return () => {
            backButton.off('click', handleClose);
            backButton.hide();
        };
    }, [handleClose, backButton]);
};
