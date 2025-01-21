import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AppRoute } from '../../../libs/routes';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../Error';
import { MobileProHeaderWallet } from './MobileProHeaderWallet';
import { MobileProHeaderAccount } from './MobileProHeaderAccount';
import { MobileProHeaderContainer } from './MobileProHeaderElements';
import { FC, PropsWithChildren } from 'react';
import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { ChevronLeftIcon } from '../../Icon';
import { Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { useNavigate } from "../../../hooks/router/useNavigate";

const MobileProHeaderContainerStyled = styled(MobileProHeaderContainer)`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    ${IconButtonTransparentBackground} {
        position: absolute;
        top: 8px;
        left: 8px;
    }
`;

const MobileProHeaderContent = () => {
    const route = useAsideActiveRoute();
    const { t } = useTranslation();

    if (!route) {
        return <MobileProHeaderWallet />;
    }

    if (route === AppRoute.accountSettings) {
        return <MobileProHeaderAccount />;
    }

    if (route === AppRoute.browser) {
        return <MobileProHeaderContentSimple>{t('browser_title')}</MobileProHeaderContentSimple>;
    }
    return <MobileProHeaderContainer />;
};

const MobileProHeaderContentSimple: FC<PropsWithChildren> = ({ children }) => {
    const navigate = useNavigate();
    return (
        <MobileProHeaderContainerStyled>
            <IconButtonTransparentBackground onClick={() => navigate(-1)}>
                <ChevronLeftIcon />
            </IconButtonTransparentBackground>
            <Label2>{children}</Label2>
        </MobileProHeaderContainerStyled>
    );
};

export const MobileProHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display aside header')}>
            <MobileProHeaderContent />
        </ErrorBoundary>
    );
};
