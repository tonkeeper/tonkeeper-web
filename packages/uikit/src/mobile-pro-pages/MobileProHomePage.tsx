import styled from 'styled-components';
import { MobileProHomeBalance } from '../components/mobile-pro/home/MobileProHomeBalance';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import React, { useEffect, useMemo } from 'react';
import { MobileProHomeActions } from '../components/mobile-pro/home/MobileProHomeActions';
import { MobileProHomeWidgetTokens } from '../components/mobile-pro/home/widgets/MobileProHomeWidgetTokens';
import { MobileProWidgetNfts } from '../components/mobile-pro/home/widgets/MobileProWidgetNfts';
import { useWalletFilteredNftList } from '../state/nft';
import { KnownNFTDnsCollections } from '../components/nft/NftView';
import { Link } from '../components/shared/Link';
import {
    BatteryIcon,
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
import { HideOnReview } from '../components/ios/HideOnReview';
import {
    useActiveAccount,
    useActiveTonNetwork,
    useActiveTonWalletConfig,
    useIsActiveWalletWatchOnly,
    useMutateActiveTonWalletConfig
} from '../state/wallet';
import { useIsActiveAccountMultisig, useUnviewedAccountOrdersNumber } from '../state/multisig';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useBatteryBalance, useCanUseBattery } from '../state/battery';
import { RoundedBadge } from '../components/shared/Badge';
import { MobileProWidgetHistory } from '../components/mobile-pro/home/widgets/MobileProWidgetHistory';
import { useFetchFilteredActivity } from '../state/activity';
import { AccountAndWalletBadgesGroup } from '../components/account/AccountBadge';

const IonContentStyled = styled(IonContent)`
    &::part(background) {
        background: transparent;
    }

    &::part(scroll) {
        padding-bottom: env(safe-area-inset-bottom);
        overscroll-behavior: auto;
    }
`;

const MobileProHomeBalanceStyled = styled(MobileProHomeBalance)`
    margin: 32px 8px 8px;
`;

const MobileProHomeActionsStyled = styled(MobileProHomeActions)`
    margin: 0 16px 24px;
`;

const MenuItem = styled(Link)`
    height: 40px;
    padding-left: 1rem;
    display: flex;
    align-items: center;
    gap: 8px;

    svg {
        color: ${p => p.theme.iconSecondary};
    }
`;

const MenuWrapper = styled.div`
    padding: 8px 0;
`;

const SwapIconStyled = styled(SwapIcon)`
    transform: rotate(90deg) scale(1, -1);
`;

export const mobileProHomePageId = 'mobile-pro-home-page';

const useMobileProHomePageNfts = () => {
    const { data: nfts } = useWalletFilteredNftList();
    const { data: config } = useActiveTonWalletConfig();
    const { mutate: mutateConfig } = useMutateActiveTonWalletConfig();

    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    useEffect(() => {
        if (filteredNft && config && filteredNft.length !== config.cachedOwnCollectablesNumber) {
            mutateConfig({ cachedOwnCollectablesNumber: filteredNft.length });
        }
    }, [filteredNft, config?.cachedOwnCollectablesNumber, mutateConfig]);

    let showNftWidget = !!config;
    if (config) {
        if (
            config.cachedOwnCollectablesNumber === undefined ||
            config.cachedOwnCollectablesNumber >= 3
        ) {
            showNftWidget = true;
        } else {
            showNftWidget = false;
        }
    }

    if (filteredNft) {
        showNftWidget = filteredNft.length >= 3;
    }

    return {
        filteredNft,
        showNftWidget
    };
};

const useMobileProHomePageHistory = () => {
    const { data: activity } = useFetchFilteredActivity();
    const { data: config } = useActiveTonWalletConfig();
    const { mutate: mutateConfig } = useMutateActiveTonWalletConfig();

    useEffect(() => {
        if (activity && config && !config.cachedHasHistory) {
            mutateConfig({ cachedHasHistory: !!activity.length });
        }
    }, [activity, config?.cachedHasHistory, mutateConfig]);

    let showHistoryWidget = config?.cachedHasHistory !== false;

    if (activity) {
        showHistoryWidget = !!activity.length;
    }

    const slicedActivity = useMemo(() => activity?.slice(0, 1), [activity]);

    return {
        activity: slicedActivity,
        showHistoryWidget
    };
};

const IonHeaderStyled = styled(IonHeader)`
    position: relative;
    overflow: visible; // Позволяет градиенту выходить за пределы

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: calc(256px + env(safe-area-inset-top));

        opacity: 0.16;
        background: linear-gradient(
            180deg,
            #7665e5 0%,
            rgba(118, 101, 229, 0.99) 6.67%,
            rgba(118, 101, 229, 0.96) 13.33%,
            rgba(118, 101, 229, 0.92) 20%,
            rgba(118, 101, 229, 0.85) 26.67%,
            rgba(118, 101, 229, 0.77) 33.33%,
            rgba(118, 101, 229, 0.67) 40%,
            rgba(118, 101, 229, 0.56) 46.67%,
            rgba(118, 101, 229, 0.44) 53.33%,
            rgba(118, 101, 229, 0.33) 60%,
            rgba(118, 101, 229, 0.23) 66.67%,
            rgba(118, 101, 229, 0.15) 73.33%,
            rgba(118, 101, 229, 0.08) 80%,
            rgba(118, 101, 229, 0.04) 86.67%,
            rgba(118, 101, 229, 0.01) 93.33%,
            rgba(118, 101, 229, 0) 100%
        );

        z-index: -1;
    }
`;

const IonToolbarStyled = styled(IonToolbar)`
    --background: transparent;
    --border-width: 0 !important;
`;

const IonTitleWrapper = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
    justify-content: center;
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
    const { showNftWidget, filteredNft } = useMobileProHomePageNfts();
    const { showHistoryWidget, activity } = useMobileProHomePageHistory();

    const activeAccount = useActiveAccount();

    return (
        <IonPage id={mobileProHomePageId}>
            <IonHeaderStyled>
                <IonToolbarStyled>
                    <IonTitle>
                        <IonTitleWrapper>
                            <Label2>
                                {activeAccount.type === 'mam'
                                    ? activeAccount.activeDerivation.name
                                    : activeAccount.name}
                            </Label2>
                            <AccountAndWalletBadgesGroup
                                account={activeAccount}
                                walletId={activeAccount.activeTonWallet.id}
                            />
                        </IonTitleWrapper>
                    </IonTitle>
                </IonToolbarStyled>
            </IonHeaderStyled>
            <IonContentStyled>
                <MobileProHomeBalanceStyled />
                <MobileProHomeActionsStyled />
                <MobileProHomeWidgetTokens />
                {showNftWidget && <MobileProWidgetNfts nfts={filteredNft} />}
                {showHistoryWidget && <MobileProWidgetHistory activity={activity} />}
                <MenuWrapper>
                    <HideOnReview>
                        {!showHistoryWidget && (
                            <MenuItem to={AppRoute.activity}>
                                <ClockSmoothIcon />
                                <Label2>{t('wallet_aside_history')}</Label2>
                            </MenuItem>
                        )}
                        {!showNftWidget && (
                            <MenuItem to={AppRoute.purchases}>
                                <SaleBadgeIcon />
                                <Label2>{t('wallet_aside_collectibles')}</Label2>
                            </MenuItem>
                        )}
                        <MenuItem to={AppRoute.dns}>
                            <SparkIcon />
                            <Label2>{t('wallet_aside_domains')}</Label2>
                        </MenuItem>
                        {!isReadOnly && !isTestnet && (
                            <MenuItem to={AppRoute.swap}>
                                <SwapIconStyled />
                                <Label2>{t('wallet_swap')}</Label2>
                            </MenuItem>
                        )}
                        {isMultisig && !isTestnet && <MultisigOrdersMenuItem />}
                        {showMultisigs && !isTestnet && (
                            <MenuItem to={AppRoute.multisigWallets}>
                                <ListIcon />
                                <Label2>{t('wallet_aside_multisig_wallets')}</Label2>
                            </MenuItem>
                        )}
                        {canUseBattery && <BatterySettingsListItem />}
                    </HideOnReview>
                    <MenuItem to={AppRoute.walletSettings}>
                        <SettingsSmoothIcon />
                        <Label2>{t('wallet_aside_settings')}</Label2>
                    </MenuItem>
                </MenuWrapper>
            </IonContentStyled>
        </IonPage>
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
        <MenuItem to={AppRoute.multisigOrders}>
            <InboxIcon />
            <Label2>{t('wallet_aside_orders')}</Label2>
            {!!ordersNumber && <BadgeStyled>{ordersNumber}</BadgeStyled>}
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
        </MenuItem>
    );
};
