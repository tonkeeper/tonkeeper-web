import { FC, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { useWalletState } from '../../state/wallet';
import { Body2, Body3 } from '../Text';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateActiveWallet } from '../../state/account';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppProRoute, AppRoute } from '../../libs/routes';
import { scrollToTop } from '../../libs/common';

const AsideContainer = styled.div`
    background: ${p => p.theme.backgroundContent};
    padding: 0.5rem 0;
`;

const AsideMenuCard = styled.button<{ isSelected: boolean; padding: 's' | 'm' }>`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : p.theme.backgroundContent)};
    ${p => (p.padding === 's' ? 'padding: 6px 16px' : 'padding: 8px 16px')};

    width: 100%;
    display: flex;
    flex-direction: column;

    & > ${Body3} {
        color: ${props => props.theme.textSecondary};
    }

    transition: background-color 0.2s ease-in-out;

    &:hover {
        background: ${p => p.theme.backgroundContentTint};
    }
`;

export const AsideMenuAccount: FC<{ publicKey: string; isSelected: boolean }> = ({
    publicKey,
    isSelected
}) => {
    const { t } = useTranslation();
    const { data: wallet } = useWalletState(publicKey);
    const { mutate } = useMutateActiveWallet();
    const navigate = useNavigate();

    const handleNavigateHome = useCallback(() => {
        if (location.pathname !== AppRoute.home) {
            return navigate(AppRoute.home);
        } else {
            scrollToTop();
        }
    }, [location.pathname]);

    const onClick = useCallback(() => {
        mutate(publicKey);
        handleNavigateHome();
    }, [publicKey, mutate, handleNavigateHome]);

    if (!wallet) {
        return null; //TODO
    }

    const address = formatAddress(wallet.active.rawAddress, wallet.network);
    const name = wallet.name ? wallet.name : t('wallet_title');

    return (
        <AsideMenuCard isSelected={isSelected} padding="s" onClick={onClick}>
            <Body2>{name}</Body2>
            <Body3>{toShortValue(address)}</Body3>
        </AsideMenuCard>
    );
};

export const AsideMenu: FC<{ className?: string }> = ({ className }) => {
    const { account } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const activeProRoute = useMemo<AppProRoute | undefined>(() => {
        if (location.pathname.startsWith(AppProRoute.dashboard)) {
            return AppProRoute.dashboard;
        }

        return undefined;
    }, [location.pathname]);

    const handleNavigateClick = useCallback(
        (route: AppProRoute) => {
            if (location.pathname !== route) {
                return navigate(route);
            } else {
                scrollToTop();
            }
        },
        [location.pathname]
    );

    return (
        <AsideContainer className={className}>
            <AsideMenuCard
                isSelected={activeProRoute === AppProRoute.dashboard}
                padding="m"
                onClick={() => handleNavigateClick(AppProRoute.dashboard)}
            >
                <Body2>Dashboard</Body2> {/*TODO*/}
            </AsideMenuCard>
            {account.publicKeys.map(publicKey => (
                <AsideMenuAccount
                    key={publicKey}
                    publicKey={publicKey}
                    isSelected={
                        !activeProRoute &&
                        !!account.activePublicKey &&
                        account.activePublicKey === publicKey
                    }
                />
            ))}
        </AsideContainer>
    );
};
