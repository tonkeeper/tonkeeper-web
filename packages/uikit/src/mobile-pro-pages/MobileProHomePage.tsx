import styled from 'styled-components';
import React from 'react';
import { MobileProHomeActions } from '../components/mobile-pro/home/MobileProHomeActions';
import { MobileProHomeWidgetTokens } from '../components/mobile-pro/home/widgets/MobileProHomeWidgetTokens';
import { Link } from '../components/shared/Link';
import {
    BatteryIcon,
    ChevronRightIcon,
    ClockSmoothIcon,
    InboxIcon,
    ListIcon,
    SaleBadgeIcon,
    SettingsSmoothIcon,
    SparkIcon,
    SwapIcon
} from '../components/Icon';
import { Body3, Label2 } from '../components/Text';
import { useTranslation } from '../hooks/translation';
import { AppRoute, WalletSettingsRoute } from '../libs/routes';
import { useActiveAccount, useActiveTonNetwork, useIsActiveWalletWatchOnly } from '../state/wallet';
import { useIsActiveAccountMultisig, useUnviewedAccountOrdersNumber } from '../state/multisig';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useBatteryBalance, useCanUseBattery } from '../state/battery';
import { RoundedBadge } from '../components/shared/Badge';
import { MobileProHomeBalance } from '../components/mobile-pro/home/MobileProHomeBalance';
import { HideOnReview } from '../components/ios/HideOnReview';
import { PullToRefresh } from '../components/mobile-pro/PullToRefresh';
import { DesktopViewHeader, DesktopViewPageLayout } from '../components/desktop/DesktopViewLayout';
import { TwoFARecoveryStartedBanner } from '../components/settings/two-fa/TwoFARecoveryStartedBanner';

const MobileProHomeActionsStyled = styled(MobileProHomeActions)`
    margin: 0 8px 16px;
`;

const MobileProHomeWidgetTokensStyled = styled(MobileProHomeWidgetTokens)`
    margin: 0 8px 16px;
`;

const MenuItem = styled(Link)`
    height: 40px;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
        color: ${p => p.theme.iconSecondary};
    }

    > *:last-child {
        margin-left: auto;
    }
`;

const Divider = styled.div`
    height: 1px;
    background-color: ${p => p.theme.separatorAlternate};
    width: 100%;
`;

const MenuWrapper = styled.div`
    margin: 0 8px;
    border-radius: ${p => p.theme.corner2xSmall};
    background-color: ${p => p.theme.backgroundContent};
`;

const SwapIconStyled = styled(SwapIcon)`
    transform: rotate(90deg) scale(1, -1);
`;

const mobileProHomePageId = 'mobile-pro-home-page';

const DesktopViewHeaderStyled = styled(DesktopViewHeader)`
    ion-toolbar {
        height: 0;
    }
`;

const TwoFARecoveryStartedBannerStyled = styled(TwoFARecoveryStartedBanner)`
    margin: 0 8px -8px;
`;

const BannerPadding = styled.div`
    height: 16px;
`;

export const MobileProHomePage = () => {
    const { t } = useTranslation();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isMultisig = useIsActiveAccountMultisig();
    const account = useActiveAccount();
    const showMultisigs = isAccountCanManageMultisigs(account);
    const network = useActiveTonNetwork();
    const isTestnet = network === Network.TESTNET;
    const canUseBattery = useCanUseBattery();

    return (
        <DesktopViewPageLayout id={mobileProHomePageId}>
            <DesktopViewHeaderStyled mobileTranslucent={false} />
            <PullToRefresh invalidate={account.id} />
            <TwoFARecoveryStartedBannerStyled>
                <BannerPadding />
            </TwoFARecoveryStartedBannerStyled>
            <MobileProHomeBalance />
            <MobileProHomeActionsStyled />
            <MobileProHomeWidgetTokensStyled />
            <MenuWrapper>
                <MenuItem to={AppRoute.activity}>
                    <ClockSmoothIcon />
                    <Label2>{t('wallet_aside_history')}</Label2>
                    <ChevronRightIcon />
                </MenuItem>
                <Divider />
                <HideOnReview>
                    <MenuItem to={AppRoute.purchases}>
                        <SaleBadgeIcon />
                        <Label2>{t('wallet_aside_collectibles')}</Label2>
                        <ChevronRightIcon />
                    </MenuItem>
                    <Divider />
                    <MenuItem to={AppRoute.dns}>
                        <SparkIcon />
                        <Label2>{t('wallet_aside_domains')}</Label2>
                        <ChevronRightIcon />
                    </MenuItem>
                    <Divider />
                    {!isReadOnly && !isTestnet && (
                        <>
                            <MenuItem to={AppRoute.swap}>
                                <SwapIconStyled />
                                <Label2>{t('wallet_swap')}</Label2>
                                <ChevronRightIcon />
                            </MenuItem>
                            <Divider />
                        </>
                    )}
                    {isMultisig && !isTestnet && (
                        <>
                            <MultisigOrdersMenuItem />
                            <Divider />
                        </>
                    )}
                    {showMultisigs && !isTestnet && (
                        <>
                            <MenuItem to={AppRoute.multisigWallets}>
                                <ListIcon />
                                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                                <ChevronRightIcon />
                            </MenuItem>
                            <Divider />
                        </>
                    )}
                    {canUseBattery && (
                        <>
                            <BatterySettingsListItem />
                            <Divider />
                        </>
                    )}
                </HideOnReview>
                <MenuItem to={AppRoute.walletSettings}>
                    <SettingsSmoothIcon />
                    <Label2>{t('wallet_aside_settings')}</Label2>
                    <ChevronRightIcon />
                </MenuItem>
            </MenuWrapper>
        </DesktopViewPageLayout>
    );
};

const MultisigOrdersMenuItem = () => {
    const ordersNumber = useUnviewedAccountOrdersNumber();
    const { t } = useTranslation();

    return (
        <MenuItem to={AppRoute.multisigOrders}>
            <InboxIcon />
            <Label2>{t('wallet_aside_orders')}</Label2>
            {!!ordersNumber && <RoundedBadge>{ordersNumber}</RoundedBadge>}
            <ChevronRightIcon />
        </MenuItem>
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

    return (
        <MenuItem to={AppRoute.walletSettings + WalletSettingsRoute.battery}>
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
            <ChevronRightIcon />
        </MenuItem>
    );
};
