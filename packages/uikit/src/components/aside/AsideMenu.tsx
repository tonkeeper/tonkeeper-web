import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { FC, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { scrollToTop } from '../../libs/common';
import { AppProRoute, AppRoute } from '../../libs/routes';
import { useMutateActiveWallet } from '../../state/account';
import { useWalletState } from '../../state/wallet';
import { PlusIcon, SlidersIcon } from '../Icon';
import { Body2, Body3 } from '../Text';
import { ImportNotification } from '../create/ImportNotification';
import { SubscriptionInfo } from './SubscriptionInfo';

const AsideContainer = styled.div`
    height: 100%;
    overflow: auto;
    box-sizing: border-box;

    background: ${p => p.theme.backgroundContent};
    display: flex;
    flex-direction: column;
    padding: 0.5rem 0;
`;

const IconWrapper = styled.div`
    color: ${p => p.theme.iconSecondary};
    height: fit-content;

    > svg {
        display: block;
    }
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

    & > ${Body2} {
        text-align: left;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    transition: background-color 0.2s ease-in-out;

    &:hover {
        background: ${p => p.theme.backgroundContentTint};
    }
`;

const AsideMenuBottom = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
`;

const AsideMenuItemIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
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
        return null;
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
    const { t } = useTranslation();
    const [isOpenImport, setIsOpenImport] = useState(false);
    const { account, proFeatures } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const activeRoute = useMemo<string | undefined>(() => {
        if (location.pathname.startsWith(AppProRoute.dashboard)) {
            return AppProRoute.dashboard;
        }

        if (location.pathname.startsWith(AppRoute.settings)) {
            return AppRoute.settings;
        }

        return undefined;
    }, [location.pathname]);

    const handleNavigateClick = useCallback(
        (route: string) => {
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
            {proFeatures && (
                <AsideMenuCard
                    isSelected={activeRoute === AppProRoute.dashboard}
                    padding="m"
                    onClick={() => handleNavigateClick(AppProRoute.dashboard)}
                >
                    <Body2>{t('aside_dashboard')}</Body2>
                </AsideMenuCard>
            )}
            {account.publicKeys.map(publicKey => (
                <AsideMenuAccount
                    key={publicKey}
                    publicKey={publicKey}
                    isSelected={
                        !activeRoute &&
                        !!account.activePublicKey &&
                        account.activePublicKey === publicKey
                    }
                />
            ))}
            <AsideMenuBottom>
                <AsideMenuCard padding="m" isSelected={false} onClick={() => setIsOpenImport(true)}>
                    <AsideMenuItemIcon>
                        <Body2>{t('aside_add_wallet')}</Body2>
                        <IconWrapper>
                            <PlusIcon />
                        </IconWrapper>
                    </AsideMenuItemIcon>
                </AsideMenuCard>
                <AsideMenuCard
                    padding="m"
                    onClick={() => handleNavigateClick(AppRoute.settings)}
                    isSelected={activeRoute === AppRoute.settings}
                >
                    <AsideMenuItemIcon>
                        <Body2>{t('aside_settings')}</Body2>
                        <IconWrapper>
                            <SlidersIcon />
                        </IconWrapper>
                    </AsideMenuItemIcon>
                </AsideMenuCard>
                <SubscriptionInfo />
            </AsideMenuBottom>
            <ImportNotification isOpen={isOpenImport} setOpen={setIsOpenImport} />
        </AsideContainer>
    );
};
