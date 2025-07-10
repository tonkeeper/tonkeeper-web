import { type FC } from 'react';
import styled from 'styled-components';
import { TransitionGroup, CSSTransition } from 'react-transition-group';

import { CloseIcon } from '../Icon';
import { InnerBody } from '../Body';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../desktop/DesktopViewLayout';
import { SubHeader } from '../SubHeader';
import { AppRoute } from '../../libs/routes';
import { duration } from '../transfer/common';
import { HideOnReview } from '../ios/HideOnReview';
import { isDirectionForward } from '../../libs/pro';
import { SubscriptionScreens } from '../../enums/pro';
import { ProStatusScreen } from '../pro/ProStatusScreen';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { ProAccountChooseScreen } from '../pro/ProAccountChooseScreen';
import { ProPurchaseChooseScreen } from '../pro/ProPurchaseChooseScreen';
import { useSubscriptionScreen } from '../../hooks/pro/useSubscriptionScreen';
import { SubscriptionFlowProvider } from '../../providers/SubscriptionFlowProvider';
import { leftToTight, rightToLeft, SlideAnimation } from '../shared/SlideAnimation';
import { ProSettingsContent as DeprecatedProSettingsContent } from './ProSettings';

const SCREENS_MAP = {
    [SubscriptionScreens.ACCOUNTS]: <ProAccountChooseScreen />,
    [SubscriptionScreens.PURCHASE]: <ProPurchaseChooseScreen />,
    [SubscriptionScreens.STATUS]: <ProStatusScreen />
};

export const ProSettingsContent: FC = () => {
    const navigate = useNavigate();
    const { currentScreen, prevScreen } = useSubscriptionScreen();

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

            <AnimatedScreensWrapper>
                <TransitionGroup component={null}>
                    <CSSTransition
                        key={currentScreen}
                        timeout={duration}
                        unmountOnExit
                        classNames={
                            isDirectionForward(currentScreen, prevScreen)
                                ? rightToLeft
                                : leftToTight
                        }
                    >
                        {SCREENS_MAP[currentScreen]}
                    </CSSTransition>
                </TransitionGroup>
            </AnimatedScreensWrapper>
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
                <DeprecatedProSettingsContent />
            </InnerBody>
        </HideOnReview>
    );
};

const AnimatedScreensWrapper = styled(SlideAnimation)`
    padding-bottom: env(safe-area-inset-bottom);
    padding-top: env(safe-area-inset-top);
    box-sizing: border-box;
    height: 100%;
    max-width: 768px;
    margin: 0 auto;
`;
