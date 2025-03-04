import { useAsideActiveRoute } from '../../../hooks/desktop/useAsideActiveRoute';
import { AppProRoute, AppRoute, SettingsRoute } from '../../../libs/routes';
import { ErrorBoundary } from 'react-error-boundary';
import { fallbackRenderOver } from '../../Error';
import { MobileProHeaderWallet } from './MobileProHeaderWallet';
import { MobileProHeaderAccount } from './MobileProHeaderAccount';
import { MobileProHeaderContainer, MobileProHeaderContentSimple } from './MobileProHeaderElements';
import { Label2 } from '../../Text';
import { useTranslation } from '../../../hooks/translation';
import styled from 'styled-components';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useAllWalletsTotalBalance } from '../../../state/asset';
import { Skeleton } from '../../shared/Skeleton';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useActiveTonNetwork } from '../../../state/wallet';
import { Link } from 'react-router-dom';
import { useUserFiat } from '../../../state/fiat';
import { MobileProPreferencesHeader } from './MobileProPreferencesHeader';

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

    if (route === AppRoute.settings) {
        return <MobileProPreferencesHeader />;
    }

    return <MobileProHeaderContainer />;
};

const HeaderBackground = styled.div`
    opacity: 1;
    display: block;
    content: "''";
    position: absolute;
    top: calc(0 + env(safe-area-inset-top));
    left: 0;
    right: 0;
    height: calc(52px + env(safe-area-inset-top));
    background: ${p => p.theme.backgroundContent};

    &.hidden {
        opacity: 0;
    }
`;

export const mobileHeaderBackgroundId = 'mobile-header-background';

export const MobileProHeader = () => {
    return (
        <ErrorBoundary fallbackRender={fallbackRenderOver('Failed to display aside header')}>
            <HeaderBackground id={mobileHeaderBackgroundId} />
            <MobileProHeaderContent />
        </ErrorBoundary>
    );
};
