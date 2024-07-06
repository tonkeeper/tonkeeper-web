import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { SlidersIcon } from '../../Icon';
import { SwapSettingsNotification } from '../SwapSettingsNotification';
import { useState } from 'react';

export const SwapSettingsButton = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <IconButtonTransparentBackground onClick={() => setIsOpen(true)}>
                <SlidersIcon />
            </IconButtonTransparentBackground>
            <SwapSettingsNotification isOpen={isOpen} onClose={() => setIsOpen(false)} />
        </>
    );
};
