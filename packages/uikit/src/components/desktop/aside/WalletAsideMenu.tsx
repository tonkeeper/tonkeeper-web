import { useLocation } from 'react-router-dom';
import styled, { css } from 'styled-components';
import { useTranslation } from '../../../hooks/translation';
import { hexToRGBA } from '../../../libs/css';
import { AppRoute, WalletSettingsRoute } from '../../../libs/routes';
import {
    useActiveAccount,
    useActiveTonNetwork,
    useIsActiveWalletWatchOnly
} from '../../../state/wallet';
import {
    BatteryIcon,
    ClockSmoothIcon,
    CoinsIcon,
    InboxIcon,
    ListIcon,
    SaleBadgeIcon,
    SettingsSmoothIcon,
    SparkIcon,
    SwapIcon
} from '../../Icon';
import { Body3, Label2 } from '../../Text';
import { AsideMenuItem } from '../../shared/AsideItem';
import {
    useIsActiveAccountMultisig,
    useUnviewedAccountOrdersNumber
} from '../../../state/multisig';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { RoundedBadge } from '../../shared/Badge';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useBatteryBalance, useCanSeeBattery } from '../../../state/battery';
import { HideOnReview } from '../../ios/HideOnReview';
import { NavLink } from '../../shared/NavLink';
import { ForTargetEnv } from '../../shared/TargetEnv';
import { useCallback, useEffect } from 'react';
import { useMenuController } from '../../../hooks/ionic';
import { WalletAsideMenuBrowserTabs } from './WalletAsideMenuBrowserTabs';
import { useHideActiveBrowserTab, useIsBrowserOpened } from '../../../state/dapp-browser';
import { IfFeatureEnabled } from '../../shared/IfFeatureEnabled';
import { FLAGGED_FEATURE } from '../../../state/tonendpoint';

const WalletAsideContainer = styled.div`
    overflow: auto;
    padding: 0.5rem;
    background: ${p =>
        p.theme.proDisplayType === 'desktop'
            ? hexToRGBA(p.theme.backgroundContent, 0.56)
            : p.theme.backgroundPage};

    > a {
        text-decoration: unset;
        color: unset;
    }

    * {
        user-select: none;
    }

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            border-right: 1px solid ${p.theme.backgroundContentAttention};
            width: fit-content;
        `}
`;

const AsideMenuItemStyled = styled(AsideMenuItem)`
    background: ${p =>
        p.isSelected
            ? p.theme.proDisplayType === 'desktop'
                ? p.theme.backgroundContentTint
                : p.theme.backgroundContent
            : 'unset'};
    padding-right: 50px;
    height: unset;
    position: relative;

    > svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const SwapIconStyled = styled(SwapIcon)`
    transform: rotate(90deg) scale(1, -1);
`;

const useHideBrowserAfterNavigation = () => {
    const { mutate: hideBrowser } = useHideActiveBrowserTab();
    return useCallback(() => {
        setTimeout(() => {
            hideBrowser();
        }, 150);
    }, [hideBrowser]);
};

export const WalletAsideMenu = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const isMultisig = useIsActiveAccountMultisig();
    const account = useActiveAccount();
    const showMultisigs = isAccountCanManageMultisigs(account);
    const network = useActiveTonNetwork();

    const isTestnet = network === Network.TESTNET;

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const canUseBattery = useCanSeeBattery();

    const menuController = useMenuController('wallet-nav');
    useEffect(() => {
        menuController.close();
    }, [location]);

    const hideBrowser = useHideBrowserAfterNavigation();
    const isBrowserOpened = useIsBrowserOpened();

    return (
        <WalletAsideContainer>
            <NavLink to={AppRoute.coins} end disableMobileAnimation onClick={hideBrowser}>
                {({ isActive }) => (
                    <AsideMenuItemStyled
                        isSelected={(isActive || isCoinPageOpened) && !isBrowserOpened}
                    >
                        <CoinsIcon />
                        <Label2>{t('wallet_aside_tokens')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <NavLink to={AppRoute.activity} disableMobileAnimation onClick={hideBrowser}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                        <ClockSmoothIcon />
                        <Label2>{t('wallet_aside_history')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>

            <HideOnReview>
                <NavLink to={AppRoute.purchases} disableMobileAnimation onClick={hideBrowser}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                            <SaleBadgeIcon />
                            <Label2>{t('wallet_aside_collectibles')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NavLink to={AppRoute.dns} disableMobileAnimation onClick={hideBrowser}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                            <SparkIcon />
                            <Label2>{t('wallet_aside_domains')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <SwapItem />
                {isMultisig && !isTestnet && <MultisigOrdersMenuItem />}
                {showMultisigs && !isTestnet && (
                    <NavLink
                        to={AppRoute.multisigWallets}
                        disableMobileAnimation
                        onClick={hideBrowser}
                    >
                        {({ isActive }) => (
                            <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                                <ListIcon />
                                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                            </AsideMenuItemStyled>
                        )}
                    </NavLink>
                )}
                {canUseBattery && <BatterySettingsListItem />}
            </HideOnReview>
            <NavLink to={AppRoute.walletSettings} end disableMobileAnimation onClick={hideBrowser}>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                        <SettingsSmoothIcon />
                        <Label2>{t('wallet_aside_settings')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>
            <ForTargetEnv env="mobile">
                <WalletAsideMenuBrowserTabs />
            </ForTargetEnv>
        </WalletAsideContainer>
    );
};

const BadgeStyled = styled(RoundedBadge)`
    margin-left: auto;
    margin-right: -40px;
`;

const SwapItem = () => {
    const isReadOnly = useIsActiveWalletWatchOnly();
    const { t } = useTranslation();
    const isTestnet = useActiveTonNetwork() === Network.TESTNET;
    const hideBrowser = useHideBrowserAfterNavigation();
    const isBrowserOpened = useIsBrowserOpened();

    return (
        <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
            {!isReadOnly && !isTestnet && (
                <NavLink to={AppRoute.swap} disableMobileAnimation onClick={hideBrowser}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                            <SwapIconStyled />
                            <Label2>{t('wallet_swap')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            )}
        </IfFeatureEnabled>
    );
};

const MultisigOrdersMenuItem = () => {
    const ordersNumber = useUnviewedAccountOrdersNumber();
    const { t } = useTranslation();
    const hideBrowser = useHideBrowserAfterNavigation();
    const isBrowserOpened = useIsBrowserOpened();

    return (
        <NavLink to={AppRoute.multisigOrders} onClick={hideBrowser} disableMobileAnimation>
            {({ isActive }) => (
                <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                    <InboxIcon />
                    <Label2>{t('wallet_aside_orders')}</Label2>
                    {!!ordersNumber && <BadgeStyled>{ordersNumber}</BadgeStyled>}
                </AsideMenuItemStyled>
            )}
        </NavLink>
    );
};

const SettingsListText = styled.div`
    display: flex;
    flex-direction: column;
    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const BatterySettingsListItem = () => {
    const { t } = useTranslation();
    const { data: batteryBalance } = useBatteryBalance();
    const hideBrowser = useHideBrowserAfterNavigation();
    const isBrowserOpened = useIsBrowserOpened();

    return (
        <NavLink
            to={AppRoute.walletSettings + WalletSettingsRoute.battery}
            disableMobileAnimation
            onClick={hideBrowser}
        >
            {({ isActive }) => (
                <AsideMenuItemStyled isSelected={isActive && !isBrowserOpened}>
                    <BatteryIcon />
                    <SettingsListText>
                        <Label2>{t('battery_title')}</Label2>
                        {batteryBalance?.batteryUnitsBalance.gt(0) && (
                            <Body3>
                                {t('battery_charges', {
                                    charges: batteryBalance.batteryUnitsBalance.toString()
                                })}
                            </Body3>
                        )}
                    </SettingsListText>
                </AsideMenuItemStyled>
            )}
        </NavLink>
    );
};
