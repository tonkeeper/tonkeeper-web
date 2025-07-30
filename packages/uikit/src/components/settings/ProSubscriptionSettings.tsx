import { type FC } from 'react';
import styled from 'styled-components';

import { CloseIcon } from '../Icon';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../desktop/DesktopViewLayout';
import { AppRoute } from '../../libs/routes';
import { ForTargetEnv } from '../shared/TargetEnv';
import { ProStatusScreen } from '../pro/ProStatusScreen';
import { useNavigate } from '../../hooks/router/useNavigate';
import { IconButtonTransparentBackground } from '../fields/IconButton';

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
                        <ForTargetEnv env="mobile">
                            <IconButtonTransparentBackground onClick={handleCloseClick}>
                                <CloseIcon />
                            </IconButtonTransparentBackground>
                        </ForTargetEnv>
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

export const ProSubscriptionSettings: FC = () => (
    <DesktopViewPageLayoutStyled>
        <ProSettingsContent />
    </DesktopViewPageLayoutStyled>
);
