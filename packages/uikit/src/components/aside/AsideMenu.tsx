import React, { FC, useCallback, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useWalletState } from '../../state/wallet';
import { Body2, Body3 } from '../Text';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateActiveWallet } from '../../state/account';
import { useLocation, useNavigate } from 'react-router-dom';
import { AppProRoute, AppRoute, SettingsRoute } from '../../libs/routes';
import { scrollToTop } from '../../libs/common';
import { ImportNotification } from '../create/ImportNotification';
import { PlusIcon, SlidersIcon } from '../Icon';

const AsideContainer = styled.div`
    background: ${p => p.theme.backgroundContent};
    position: relative;
    overflow: auto;
    display: flex;
    flex-direction: column;
`;

const AsideScrollContent = styled.div`
    padding: 0.5rem 0;
    flex: 1;
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

    transition: background-color 0.2s ease-in-out;

    &:hover {
        background: ${p => p.theme.backgroundContentTint};
    }
`;

const AsideMenuBottom = styled.div`
    position: sticky;
    bottom: 0;
    padding-bottom: 0.5rem;
    background: inherit;
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
    const [isOpenImport, setIsOpenImport] = useState(false);
    const { account } = useAppContext();
    const navigate = useNavigate();
    const location = useLocation();

    const activeRoute = useMemo<string | undefined>(() => {
        if (location.pathname.startsWith(AppProRoute.dashboard)) {
            return AppProRoute.dashboard;
        }

        if (location.pathname.startsWith(AppRoute.settings + SettingsRoute.account)) {
            return AppRoute.settings + SettingsRoute.account;
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
            <AsideScrollContent>
                <AsideMenuCard
                    isSelected={activeRoute === AppProRoute.dashboard}
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
                            !activeRoute &&
                            !!account.activePublicKey &&
                            account.activePublicKey === publicKey
                        }
                    />
                ))}
            </AsideScrollContent>
            <AsideMenuBottom>
                <AsideMenuCard padding="m" isSelected={false} onClick={() => setIsOpenImport(true)}>
                    <AsideMenuItemIcon>
                        <Body2>Add Wallet</Body2>
                        <IconWrapper>
                            <PlusIcon />
                        </IconWrapper>
                    </AsideMenuItemIcon>
                </AsideMenuCard>
                <AsideMenuCard
                    padding="m"
                    onClick={() => handleNavigateClick(AppRoute.settings + SettingsRoute.account)}
                    isSelected={activeRoute === AppRoute.settings + SettingsRoute.account}
                >
                    <AsideMenuItemIcon>
                        <Body2>Settings</Body2>
                        <IconWrapper>
                            <SlidersIcon />
                        </IconWrapper>
                    </AsideMenuItemIcon>
                </AsideMenuCard>
            </AsideMenuBottom>
            <ImportNotification isOpen={isOpenImport} setOpen={setIsOpenImport} />
        </AsideContainer>
    );
};
