import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { hexToRGBA } from '../../../libs/css';
import { AppRoute } from '../../../libs/routes';
import { useActiveAccount, useIsActiveWalletWatchOnly } from '../../../state/wallet';
import {
    ClockSmoothIcon,
    CoinsIcon,
    ListIcon,
    SaleBadgeIcon,
    SettingsSmoothIcon,
    SparkIcon,
    SwapIcon,
    TextIcon
} from '../../Icon';
import { Label2 } from '../../Text';
import { AsideMenuItem } from '../../shared/AsideItem';
import { useIsActiveAccountMultisig } from '../../../state/multisig';
import { isAccountMultisigManageable } from '@tonkeeper/core/dist/entries/account';

const WalletAsideContainer = styled.div`
    padding: 0.5rem;
    width: fit-content;
    border-right: 1px solid ${p => p.theme.backgroundContentAttention};
    background: ${p => hexToRGBA(p.theme.backgroundContent, 0.56)};

    > a {
        text-decoration: unset;
        color: unset;
    }

    * {
        user-select: none;
    }
`;

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p => (p.isSelected ? p.theme.backgroundContentTint : 'unset')};
    padding-right: 50px;

    > svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const SwapIconStyled = styled(SwapIcon)`
    transform: rotate(90deg) scale(1, -1);
`;

export const WalletAsideMenu = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isMultisig = useIsActiveAccountMultisig();
    const account = useActiveAccount();
    const showMultisigs = isAccountMultisigManageable(account);

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    return (
        <WalletAsideContainer>
            <NavLink to={AppRoute.home}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                        <CoinsIcon />
                        <Label2>{t('wallet_aside_tokens')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.activity}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <ClockSmoothIcon />
                        <Label2>{t('wallet_aside_history')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.purchases}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SaleBadgeIcon />
                        <Label2>{t('wallet_aside_collectibles')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.dns}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SparkIcon />
                        <Label2>{t('wallet_aside_domains')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            {!isReadOnly && (
                <NavLink to={AppRoute.swap}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <SwapIconStyled />
                            <Label2>{t('wallet_swap')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            )}
            {isMultisig && (
                <NavLink to={AppRoute.multisigOrders}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <TextIcon />
                            <Label2>{t('wallet_aside_orders')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            )}
            {showMultisigs && (
                <NavLink to={AppRoute.multisigWallets}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <ListIcon />
                            <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            )}
            <NavLink to={AppRoute.walletSettings}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SettingsSmoothIcon />
                        <Label2>{t('wallet_aside_settings')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
        </WalletAsideContainer>
    );
};
