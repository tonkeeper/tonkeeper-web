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
    ArrowDownIcon,
    ArrowUpIcon,
    BatteryIcon,
    ClockSmoothIcon,
    CoinsIcon,
    HouseIcon,
    InboxIcon,
    ListIcon,
    PlusIconSmall,
    SaleBadgeIcon,
    ScanIcon16,
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
import { useBatteryBalance, useCanUseBattery } from '../../../state/battery';
import { HideOnReview } from '../../ios/HideOnReview';
import { NavLink } from '../../shared/NavLink';
import { ForTargetEnv, NotForTargetEnv } from '../../shared/TargetEnv';
import { useSendTransferNotification } from '../../modals/useSendTransferNotification';
import { useAppSdk } from '../../../hooks/appSdk';
import { useBuyNotification } from '../../modals/BuyNotificationControlled';
import { useEffect } from 'react';
import { useMenuController } from '../../../hooks/ionic';
import { useHighlightTronFeatureForActiveWallet } from '../../../state/tron/tron';
import { HideForRegulatoryState } from '../../HideForState';
import { CountryFeature } from '../../../state/country';
import { useSmartScanner } from '../../../hooks/useSmartScanner';

const WalletAsideContainer = styled.div`
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

const GroupsGap = styled.div`
    height: 1rem;
`;

const HighlightedIcon = styled.div`
    width: 8px;
    height: 8px;
    background-color: ${p => p.theme.accentRed};
    border-radius: ${p => p.theme.cornerFull};
    position: absolute;
    right: 10px;
    top: calc(50% - 4px);
`;

export const WalletAsideMenu = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isMultisig = useIsActiveAccountMultisig();
    const account = useActiveAccount();
    const showMultisigs = isAccountCanManageMultisigs(account);
    const network = useActiveTonNetwork();
    const { onOpen: sendTransfer } = useSendTransferNotification();
    const sdk = useAppSdk();
    const { onOpen: onBuy } = useBuyNotification();

    const isTestnet = network === Network.TESTNET;

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const canUseBattery = useCanUseBattery();

    const menuController = useMenuController('wallet-nav');
    useEffect(() => {
        menuController.close();
    }, [location]);

    const highlightTron = useHighlightTronFeatureForActiveWallet();
    const { onScan, NotificationComponent } = useSmartScanner();
    const withCloseMenu = (callback: (e: React.MouseEvent<HTMLDivElement>) => void) => {
        return (e: React.MouseEvent<HTMLDivElement>) => {
            menuController.close();
            callback(e);
        };
    };

    return (
        <WalletAsideContainer>
            <ForTargetEnv env="mobile">
                {!isReadOnly && (
                    <AsideMenuItemStyled
                        isSelected={false}
                        onClick={withCloseMenu(() => sendTransfer())}
                    >
                        <ArrowUpIcon />
                        <Label2>{t('wallet_send')}</Label2>
                    </AsideMenuItemStyled>
                )}
                {/*<HideOnReview>
                    {!isReadOnly && isStandardTonWallet && (
                        <AsideMenuItemStyled
                            isSelected={false}
                            onClick={() => navigate(AppProRoute.multiSend)}
                        >
                            <ArrowUpIcon />
                            <Label2>{t('wallet_multi_send')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </HideOnReview>*/}
                <AsideMenuItemStyled
                    isSelected={false}
                    onClick={withCloseMenu(() => {
                        sdk.uiEvents.emit('receive', {
                            method: 'receive',
                            params: {}
                        });
                    })}
                >
                    <ArrowDownIcon />
                    <Label2>{t('wallet_receive')}</Label2>
                </AsideMenuItemStyled>
                <AsideMenuItemStyled isSelected={false} onClick={withCloseMenu(onScan)}>
                    <ScanIcon16 />
                    <Label2>{t('wallet_scan_btn')}</Label2>
                </AsideMenuItemStyled>
                <HideOnReview>
                    <SwapItem />
                    <AsideMenuItemStyled isSelected={false} onClick={withCloseMenu(onBuy)}>
                        <PlusIconSmall />
                        <Label2>{t('wallet_buy')}</Label2>
                    </AsideMenuItemStyled>
                </HideOnReview>
                <GroupsGap />
                <NavLink to={AppRoute.home} end disableMobileAnimation>
                    {() => (
                        <AsideMenuItemStyled isSelected={location.pathname === AppRoute.home}>
                            <HouseIcon />
                            <Label2>{t('wallet_aside_home')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NavLink to={AppRoute.coins} end disableMobileAnimation>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                            <CoinsIcon />
                            <Label2>{t('wallet_aside_tokens')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                {NotificationComponent}
            </ForTargetEnv>
            <NotForTargetEnv env="mobile">
                <NavLink to={AppRoute.home} end>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive || isCoinPageOpened}>
                            <CoinsIcon />
                            <Label2>{t('wallet_aside_tokens')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            </NotForTargetEnv>
            <NavLink to={AppRoute.activity} disableMobileAnimation>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <ClockSmoothIcon />
                        <Label2>{t('wallet_aside_history')}</Label2>
                    </AsideMenuItemStyled>
                )}
            </NavLink>

            <HideOnReview>
                <NavLink to={AppRoute.purchases} disableMobileAnimation>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <SaleBadgeIcon />
                            <Label2>{t('wallet_aside_collectibles')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NavLink to={AppRoute.dns} disableMobileAnimation>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <SparkIcon />
                            <Label2>{t('wallet_aside_domains')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                <NotForTargetEnv env="mobile">
                    <SwapItem />
                </NotForTargetEnv>
                {isMultisig && !isTestnet && <MultisigOrdersMenuItem />}
                {showMultisigs && !isTestnet && (
                    <NavLink to={AppRoute.multisigWallets} disableMobileAnimation>
                        {({ isActive }) => (
                            <AsideMenuItemStyled isSelected={isActive}>
                                <ListIcon />
                                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                            </AsideMenuItemStyled>
                        )}
                    </NavLink>
                )}
                {canUseBattery && <BatterySettingsListItem />}
            </HideOnReview>
            <NavLink to={AppRoute.walletSettings} end disableMobileAnimation>
                {({ isActive }) => (
                    <AsideMenuItemStyled isSelected={isActive}>
                        <SettingsSmoothIcon />
                        <Label2>{t('wallet_aside_settings')}</Label2>
                        {highlightTron && <HighlightedIcon />}
                    </AsideMenuItemStyled>
                )}
            </NavLink>
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

    return (
        <HideForRegulatoryState feature={CountryFeature.swap}>
            {!isReadOnly && !isTestnet && (
                <NavLink to={AppRoute.swap} disableMobileAnimation>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <SwapIconStyled />
                            <Label2>{t('wallet_swap')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
            )}
        </HideForRegulatoryState>
    );
};

const MultisigOrdersMenuItem = () => {
    const ordersNumber = useUnviewedAccountOrdersNumber();
    const { t } = useTranslation();

    return (
        <NavLink to={AppRoute.multisigOrders}>
            {({ isActive }) => (
                <AsideMenuItemStyled isSelected={isActive}>
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

    return (
        <NavLink to={AppRoute.walletSettings + WalletSettingsRoute.battery} disableMobileAnimation>
            {({ isActive }) => (
                <AsideMenuItemStyled isSelected={isActive}>
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
