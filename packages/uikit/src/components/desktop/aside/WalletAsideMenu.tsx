import { NavLink, useLocation } from 'react-router-dom';
import styled from 'styled-components';
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
import { useBatteryBalance, useBatteryEnabledConfig } from '../../../state/battery';
import { HideOnReview } from '../../ios/HideOnReview';
import { useHighlightTronFeatureForActiveWallet } from '../../../state/tron/tron';

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
    height: unset;
    position: relative;

    > svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const SwapIconStyled = styled(SwapIcon)`
    transform: rotate(90deg) scale(1, -1);
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

    const isTestnet = network === Network.TESTNET;

    const isCoinPageOpened = location.pathname.startsWith(AppRoute.coins);

    const { disableWhole: disableWholeBattery } = useBatteryEnabledConfig();
    const canUseBattery =
        (account.type === 'mnemonic' || account.type === 'mam') && !disableWholeBattery;

    const highlightTron = useHighlightTronFeatureForActiveWallet();

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
            <HideOnReview>
                <NavLink to={AppRoute.dns}>
                    {({ isActive }) => (
                        <AsideMenuItemStyled isSelected={isActive}>
                            <SparkIcon />
                            <Label2>{t('wallet_aside_domains')}</Label2>
                        </AsideMenuItemStyled>
                    )}
                </NavLink>
                {!isReadOnly && !isTestnet && (
                    <NavLink to={AppRoute.swap}>
                        {({ isActive }) => (
                            <AsideMenuItemStyled isSelected={isActive}>
                                <SwapIconStyled />
                                <Label2>{t('wallet_swap')}</Label2>
                            </AsideMenuItemStyled>
                        )}
                    </NavLink>
                )}
                {isMultisig && !isTestnet && <MultisigOrdersMenuItem />}
                {showMultisigs && !isTestnet && (
                    <NavLink to={AppRoute.multisigWallets}>
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
            <NavLink to={AppRoute.walletSettings} end>
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
        <NavLink to={AppRoute.walletSettings + WalletSettingsRoute.battery}>
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
