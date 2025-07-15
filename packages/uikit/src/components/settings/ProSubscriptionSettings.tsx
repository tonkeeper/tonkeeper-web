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
import { ProStatusScreen } from '../pro/ProStatusScreen';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { IconButtonTransparentBackground } from '../fields/IconButton';
import { ProSettingsContent as DeprecatedProSettingsContent } from './ProSettings';

export const ProSettingsContent: FC = () => {
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

            <ProStatusScreen />
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
                <ProSettingsContent />
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
