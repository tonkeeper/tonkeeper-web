import styled from 'styled-components';
import { MobileProHomeBalance } from '../components/mobile-pro/home/MobileProHomeBalance';
import { IonContent, IonPage } from '@ionic/react';
import React, { useMemo } from 'react';
import { MobileProHomeActions } from '../components/mobile-pro/home/MobileProHomeActions';
import { MobileProHomeWidgetTokens } from '../components/mobile-pro/home/widgets/MobileProHomeWidgetTokens';
import { MobileProWidgetNfts } from '../components/mobile-pro/home/widgets/MobileProWidgetNfts';
import { useWalletFilteredNftList } from '../state/nft';
import { KnownNFTDnsCollections } from '../components/nft/NftView';
import { Link } from '../components/shared/Link';
import {
    BatteryIcon,
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
import { useActiveAccount, useActiveTonNetwork, useIsActiveWalletWatchOnly } from '../state/wallet';
import { useIsActiveAccountMultisig, useUnviewedAccountOrdersNumber } from '../state/multisig';
import { isAccountCanManageMultisigs } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { useBatteryBalance, useCanUseBattery } from '../state/battery';
import { RoundedBadge } from '../components/shared/Badge';

const IonContentStyled = styled(IonContent)`
    &::part(background) {
        background: transparent;
    }
`;

const PageWrapper = styled.div`
    overflow: auto;
    height: 100%;
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

export const MobileProHomePage = () => {
    const { data: nfts } = useWalletFilteredNftList();
    const { t } = useTranslation();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isMultisig = useIsActiveAccountMultisig();
    const account = useActiveAccount();
    const showMultisigs = isAccountCanManageMultisigs(account);
    const network = useActiveTonNetwork();
    const isTestnet = network === Network.TESTNET;
    const canUseBattery = useCanUseBattery();

    const filteredNft = useMemo(
        () =>
            nfts?.filter(
                nft =>
                    !nft.collection?.address ||
                    !KnownNFTDnsCollections.includes(nft.collection.address)
            ),
        [nfts]
    );

    const showNftWidget = filteredNft?.length && filteredNft.length >= 3;

    return (
        <IonPage id={mobileProHomePageId}>
            <IonContentStyled>
                <PageWrapper>
                    <MobileProHomeBalanceStyled />
                    <MobileProHomeActionsStyled />
                    <MobileProHomeWidgetTokens />
                    {showNftWidget && <MobileProWidgetNfts nfts={filteredNft} />}
                    <MenuWrapper>
                        <HideOnReview>
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
                </PageWrapper>
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
