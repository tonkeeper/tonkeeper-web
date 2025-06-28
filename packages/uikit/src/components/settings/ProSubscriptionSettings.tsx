import { type FC } from 'react';
import styled from 'styled-components';

import { CloseIcon } from '../Icon';
import { InnerBody } from '../Body';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../desktop/DesktopViewLayout';
import { SubHeader } from '../SubHeader';
import { AppRoute } from '../../libs/routes';
import { HideOnReview } from '../ios/HideOnReview';
import { SubscriptionScreens } from '../../enums/pro';
import { ProStatusScreen } from '../pro/ProStatusScreen';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { ProAccountChooseScreen } from '../pro/ProAccountChooseScreen';
import { ProPurchaseChooseScreen } from '../pro/ProPurchaseChooseScreen';
import { useSubscriptionScreen } from '../../hooks/pro/useSubscriptionScreen';
import { SubscriptionFlowProvider } from '../../providers/SubscriptionFlowProvider';

const SCREENS_MAP = {
    [SubscriptionScreens.ACCOUNTS]: <ProAccountChooseScreen />,
    [SubscriptionScreens.PURCHASE]: <ProPurchaseChooseScreen />,
    [SubscriptionScreens.STATUS]: <ProStatusScreen />
};

export const ProSettingsContent: FC = () => {
    const screen = useSubscriptionScreen();
    const navigate = useNavigate();

    const handleCloseClick = () => {
        navigate(AppRoute.home, { replace: true });
    };

    return (
        <>
            <DesktopViewHeader>
                <DesktopViewHeaderContent
                    title={null}
                    right={
                        <IconButtonTransparentBackground onClick={handleCloseClick}>
                            <CloseIcon />
                        </IconButtonTransparentBackground>
                    }
                />
            </DesktopViewHeader>

            {SCREENS_MAP[screen]}
        </>
    );
};

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    padding: 1rem 1rem 0;
    box-sizing: border-box;
    * {
        box-sizing: border-box;
    }
`;

export const ProSubscriptionSettings: FC = () => {
    const isProDisplay = useIsFullWidthMode();

    if (isProDisplay) {
        return (
            <DesktopViewPageLayoutStyled>
                <SubscriptionFlowProvider>
                    <ProSettingsContent />
                </SubscriptionFlowProvider>
            </DesktopViewPageLayoutStyled>
        );
    }

    return (
        <HideOnReview>
            <SubHeader />
            <InnerBody>
                <ProSettingsContent />
            </InnerBody>
        </HideOnReview>
    );
};
