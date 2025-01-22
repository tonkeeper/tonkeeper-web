import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AppProRoute, AppRoute, SettingsRoute } from '../../../libs/routes';
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
import { useNavigate } from '../../../hooks/router/useNavigate';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useAllWalletsTotalBalance } from '../../../state/asset';
import { Skeleton } from '../../shared/Skeleton';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useActiveTonNetwork } from '../../../state/wallet';
import { Link } from 'react-router-dom';
import { useUserFiat } from '../../../state/fiat';

const MobileProHeaderContainerStyled = styled(MobileProHeaderContainer)`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;

    ${IconButtonTransparentBackground} {
        position: absolute;
        top: calc(env(safe-area-inset-top) + 8px);
        left: 8px;
    }
`;

const BalanceContainer = styled.div`
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
`;

const MobileProHeaderContent = () => {
    const route = useAsideActiveRoute();
    const { t } = useTranslation();
    const { data: balance, isLoading } = useAllWalletsTotalBalance(Network.MAINNET);
    const network = useActiveTonNetwork();
    const fiat = useUserFiat();

    if (!route) {
        return <MobileProHeaderWallet />;
    }

    if (route === AppRoute.accountSettings) {
        return <MobileProHeaderAccount />;
    }

    if (route === AppRoute.browser) {
        return <MobileProHeaderContentSimple>{t('browser_title')}</MobileProHeaderContentSimple>;
    }

    if (route === AppProRoute.dashboard) {
        return (
            <MobileProHeaderContentSimple>
                {isLoading ? (
                    <Skeleton width="100px" height="36px" />
                ) : (
                    <BalanceContainer>
                        <Label2>{formatFiatCurrency(fiat, balance || 0)}</Label2>
                    </BalanceContainer>
                )}
                {network === Network.TESTNET && (
                    <Link to={AppRoute.settings + SettingsRoute.dev}>Testnet</Link>
                )}
            </MobileProHeaderContentSimple>
        );
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
