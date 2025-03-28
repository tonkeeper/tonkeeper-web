import { useBackButton, useSettingsButton } from '@tma.js/sdk-react';
import { InnerBody } from '@tonkeeper/uikit/dist/components/Body';
import { SwapMainForm } from '@tonkeeper/uikit/dist/components/swap/SwapMainForm';
import { SwapSettingsNotification } from '@tonkeeper/uikit/dist/components/swap/SwapSettingsNotification';
import { useSwapMobileNotification } from '@tonkeeper/uikit/dist/state/swap/useSwapMobileNotification';
import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { useNavigate } from "@tonkeeper/uikit/dist/hooks/router/useNavigate"

const Wrapper = styled(InnerBody)`
    padding: 0 16px;
`;

export const SwapScreen = () => {
    const navigate = useNavigate();
    const backButton = useBackButton();
    const settingsButton = useSettingsButton();

    const [isOpenSettings, setIsOpenSettings] = useState(false);
    const [_, setOpenSwap] = useSwapMobileNotification();

    useEffect(() => {
        const handler = () => {
            setOpenSwap(false);
            navigate(-1);
        };

        backButton.show();
        backButton.on('click', handler);

        const openSettings = () => {
            setIsOpenSettings(true);
        };
        settingsButton.show();
        settingsButton.on('click', openSettings);

        return () => {
            backButton.off('click', handler);
            backButton.hide();

            settingsButton.hide();
            settingsButton.off('click', openSettings);
        };
    }, []);

    return (
        <Wrapper>
            <SwapMainForm />
            <SwapSettingsNotification
                isOpen={isOpenSettings}
                onClose={() => setIsOpenSettings(false)}
            />
        </Wrapper>
    );
};
