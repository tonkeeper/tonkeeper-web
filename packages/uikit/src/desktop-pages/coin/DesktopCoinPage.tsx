import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { FC, RefCallback, useEffect, useMemo, useRef } from 'react';
import styled, { css } from 'styled-components';
import { ArrowDownIcon, ArrowUpIcon, LinkOutIcon, PlusIcon, SwapIcon } from '../../components/Icon';
import { Body2, Body3, Label2, Num3 } from '../../components/Text';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { DesktopHistory } from '../../components/desktop/history/DesktopHistory';
import { Button } from '../../components/fields/Button';
import { BuyNotification } from '../../components/home/BuyAction';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { formatFiatCurrency, useFormatCoinValue } from '../../hooks/balance';
import { useTranslation } from '../../hooks/translation';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useFetchNext } from '../../hooks/useFetchNext';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import { useFetchFilteredActivity, useScrollMonitor } from '../../state/activity';
import { useAssets } from '../../state/home';
import { toTokenRate, useRate, useUSDTRate } from '../../state/rates';
import { useAllSwapAssets } from '../../state/swap/useSwapAssets';
import { useSwapFromAsset } from '../../state/swap/useSwapForm';
import { FLAGGED_FEATURE, useTonendpointBuyMethods } from '../../state/tonendpoint';
import { useActiveTonNetwork, useIsActiveWalletWatchOnly } from '../../state/wallet';
import { OtherHistoryFilters } from '../../components/desktop/history/DesktopHistoryFilters';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { HideOnReview } from '../../components/ios/HideOnReview';
import {
    KNOWN_TON_ASSETS,
    TON_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    jettonToTonAssetAmount,
    tonAssetAddressFromString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useActiveTronWallet, useTronBalances } from '../../state/tron/tron';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { BorderSmallResponsive } from '../../components/shared/Styles';
import { useSendTransferNotification } from '../../components/modals/useSendTransferNotification';
import { useNavigate } from '../../hooks/router/useNavigate';
import { Navigate } from '../../components/shared/Navigate';
import { useParams } from '../../hooks/router/useParams';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { mergeRefs } from '../../libs/common';
import { ExternalLink } from '../../components/shared/ExternalLink';
import { useBatteryBalance } from '../../state/battery';
import { Link } from '../../components/shared/Link';
import { QueryKey } from '../../libs/queryKey';
import { PullToRefresh } from '../../components/mobile-pro/PullToRefresh';
import { AssetBlockchainBadge } from '../../components/account/AccountBadge';
import { Redirect } from 'react-router-dom';
import { JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import { Image } from '../../components/shared/Image';
import { IfFeatureEnabled } from '../../components/shared/IfFeatureEnabled';

export const DesktopCoinPage = () => {
    const navigate = useNavigate();
    const { name } = useParams();

    useEffect(() => {
        if (!name) {
            navigate(AppRoute.home);
        }
    }, [name]);

    const canUseTron = useActiveTronWallet();

    if (!name) return <></>;

    const token = name === 'ton' ? CryptoCurrency.TON : name;

    if (token === TRON_USDT_ASSET.id) {
        if (!canUseTron) {
            return <Navigate to={AppRoute.home} />;
        }
        return <TronUSDTPage />;
    }

    return <CoinPage token={token} />;
};

const CoinHeaderStyled = styled.div`
    padding: 0 1rem;
    border-bottom: 1px solid ${p => p.theme.separatorCommon};
`;

const HeaderButtonsContainer = styled.div`
    padding-bottom: 1rem;
    display: flex;
    gap: 0.5rem;

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            display: grid;
            grid-template-columns: 1fr 1fr;
        `}
`;

const ButtonStyled = styled(Button)`
    display: flex;
    gap: 6px;

    > svg {
        color: ${p => p.theme.buttonTertiaryForeground};
    }
`;

const CoinHeader: FC<{ token: string }> = ({ token }) => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const network = useActiveTonNetwork();

    const isReadOnly = useIsActiveWalletWatchOnly();
    const { data: buy } = useTonendpointBuyMethods();
    const canBuy = token === CryptoCurrency.TON && network !== Network.TESTNET;
    const { data: swapAssets } = useAllSwapAssets();

    const currentAssetAddress = tonAssetAddressFromString(token);
    const swapAsset =
        isReadOnly || network === Network.TESTNET
            ? undefined
            : swapAssets?.find(a => eqAddresses(a.address, currentAssetAddress));

    const [_, setSwapFromAsset] = useSwapFromAsset();
    const navigate = useNavigate();

    const onSwap = () => {
        setSwapFromAsset(swapAsset!);
        navigate(AppRoute.swap, { replace: false });
    };

    const sdk = useAppSdk();
    return (
        <CoinHeaderStyled>
            <CoinInfo token={token} />
            <HeaderButtonsContainer>
                {!isReadOnly && (
                    <ButtonStyled
                        size="small"
                        onClick={() =>
                            sdk.uiEvents.emit('transfer', {
                                method: 'transfer',
                                id: Date.now(),
                                params: { jetton: token, chain: BLOCKCHAIN_NAME.TON, from: 'token' }
                            })
                        }
                    >
                        <ArrowUpIcon />
                        {t('wallet_send')}
                    </ButtonStyled>
                )}
                <ButtonStyled
                    size="small"
                    onClick={() => {
                        sdk.uiEvents.emit('receive', {
                            method: 'receive',
                            params:
                                token === CryptoCurrency.TON
                                    ? {}
                                    : {
                                          chain: BLOCKCHAIN_NAME.TON,
                                          jetton: token
                                      }
                        });
                    }}
                >
                    <ArrowDownIcon />
                    {t('wallet_receive')}
                </ButtonStyled>
                <IfFeatureEnabled feature={FLAGGED_FEATURE.SWAPS}>
                    <IfFeatureEnabled
                        feature={FLAGGED_FEATURE.ETHENA}
                        applied={
                            eqAddresses(currentAssetAddress, KNOWN_TON_ASSETS.USDe) ||
                            eqAddresses(currentAssetAddress, KNOWN_TON_ASSETS.tsUSDe)
                        }
                    >
                        {swapAsset && (
                            <ButtonStyled size="small" onClick={onSwap}>
                                <SwapIcon />
                                {t('wallet_swap')}
                            </ButtonStyled>
                        )}
                    </IfFeatureEnabled>
                </IfFeatureEnabled>

                <IfFeatureEnabled feature={FLAGGED_FEATURE.ONRAMP}>
                    {canBuy && (
                        <ButtonStyled size="small" onClick={onOpen}>
                            <PlusIcon />
                            {t('wallet_buy')}
                        </ButtonStyled>
                    )}
                </IfFeatureEnabled>
            </HeaderButtonsContainer>
            <BuyNotification buy={buy} open={isOpen} handleClose={onClose} />
        </CoinHeaderStyled>
    );
};

const CoinInfoWrapper = styled.div`
    padding: 1rem 0;
    display: flex;

    gap: 1rem;

    > img {
        width: 56px;
        height: 56px;
        border-radius: 50%;
    }
`;

const TronCoinInfoWrapper = styled.div`
    padding: 1rem 0;
    display: flex;

    gap: 1rem;

    > img {
        width: 56px;
        height: 56px;
    }
`;

const CoinInfoAmounts = styled.div`
    > * {
        display: block;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const CoinInfo: FC<{ token: string }> = ({ token }) => {
    const [assets] = useAssets();
    const format = useFormatCoinValue();
    const { data: rate } = useRate(token);
    const { fiat } = useAppContext();

    const asset:
        | {
              symbol: string;
              image: string;
              amount: string;
              fiatAmount: string;
              noImageCorners?: boolean;
          }
        | undefined = useMemo(() => {
        if (!assets) {
            return undefined;
        }

        if (token === CryptoCurrency.TON) {
            const amount = assets.ton.info.balance;
            return {
                image: TON_ASSET.image!,
                symbol: TON_ASSET.symbol,
                amount: format(amount),
                fiatAmount: formatFiatCurrency(
                    fiat,
                    rate ? new BigNumber(rate.prices).multipliedBy(shiftedDecimals(amount)) : 0
                )
            };
        }

        if (seeIfValidTonAddress(token)) {
            const jettonBalance = assets.ton.jettons.balances.find(b =>
                eqAddresses(b.jetton.address, token)
            );

            if (!jettonBalance) {
                return undefined;
            }

            const amount = jettonBalance.balance;

            return {
                image: jettonBalance.jetton.image,
                symbol: jettonBalance.jetton.symbol,
                amount: format(amount, jettonBalance.jetton.decimals),
                fiatAmount: formatFiatCurrency(
                    fiat,
                    jettonBalance.price
                        ? shiftedDecimals(
                              jettonBalance.balance,
                              jettonBalance.jetton.decimals
                          ).multipliedBy(toTokenRate(jettonBalance.price, fiat).prices)
                        : 0
                ),
                noImageCorners: jettonToTonAssetAmount(jettonBalance).asset.noImageCorners
            };
        }

        const extra = assets.ton.info.extraBalance?.find(item => item.preview.symbol === token);

        if (!extra) return undefined;
        return {
            image: extra.preview.image,
            symbol: extra.preview.symbol,
            amount: format(extra.amount, extra.preview.decimals),
            fiatAmount: formatFiatCurrency(fiat, 0) // TODO: Extra Currency Rates
        };
    }, [assets, format, rate, fiat]);

    if (!asset) {
        return <></>;
    }

    return (
        <CoinInfoWrapper>
            <Image src={asset.image} alt={asset.symbol} noRadius={asset.noImageCorners} />
            <CoinInfoAmounts>
                <Num3>
                    {asset.amount}&nbsp;{asset.symbol}
                </Num3>
                <Body2>{asset.fiatAmount}</Body2>
            </CoinInfoAmounts>
        </CoinInfoWrapper>
    );
};

const HistorySubheader = styled(Label2)`
    display: block;
    padding: 0.5rem 1rem;
    margin-top: 0.5rem;
`;

const HistoryContainer = styled.div`
    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            overflow-x: auto;
            overflow-y: hidden;
        `}
`;

const TonViewerLink = styled(ExternalLink)`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
`;

const LabelWithBadge = styled(Label2)`
    display: flex;
    gap: 4px;
    align-items: center;
`;

const CoinPage: FC<{ token: string }> = ({ token }) => {
    const { t } = useTranslation();
    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        data: activity,
        refetch
    } = useFetchFilteredActivity(token);

    const scrollMonitorRef = useScrollMonitor(refetch, 5000);

    const fetchRef = useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, true);

    const [assets] = useAssets();
    const asset = useMemo(() => {
        if (!assets) {
            return null;
        }
        if (token === CryptoCurrency.TON) {
            return { assetSymbol: 'Toncoin', isUnverified: false };
        }

        if (seeIfValidTonAddress(decodeURIComponent(token))) {
            const item = assets.ton.jettons.balances.find(b =>
                eqAddresses(b.jetton.address, token)
            );
            if (!item) {
                return undefined;
            }
            return {
                assetSymbol: item.jetton.symbol,
                isUnverified: item.jetton.verification !== JettonVerificationType.Whitelist
            };
        } else {
            return undefined;
        }
    }, [assets, t, token]);

    const { mainnetConfig } = useAppContext();
    const tonviewer = new URL(mainnetConfig.accountExplorer).origin;

    if (asset === undefined) {
        return <Redirect to={AppRoute.home} />;
    }

    return (
        <DesktopViewPageLayout
            ref={mergeRefs(scrollMonitorRef, fetchRef) as RefCallback<HTMLDivElement>}
        >
            <DesktopViewHeader backButton borderBottom>
                <DesktopViewHeaderContent
                    title={
                        !!asset && !asset.isUnverified ? (
                            asset.assetSymbol
                        ) : (
                            <AssetTitle>
                                <Label2>{asset?.assetSymbol}</Label2>
                                <Body3>{t('approval_unverified_token')}</Body3>
                            </AssetTitle>
                        )
                    }
                    right={
                        <DesktopViewHeaderContent.Right>
                            <DesktopViewHeaderContent.RightItem>
                                <TonViewerLink
                                    href={
                                        token === CryptoCurrency.TON
                                            ? tonviewer + '/price'
                                            : mainnetConfig.accountExplorer?.replace('%s', token) ??
                                              tonviewer
                                    }
                                >
                                    <LinkOutIcon color="currentColor" />
                                    {t('tokenDetails_tonviewer_button')}
                                </TonViewerLink>
                            </DesktopViewHeaderContent.RightItem>
                            <DesktopViewHeaderContent.RightItem>
                                <OtherHistoryFilters
                                    disableInitiatorFilter={token !== CryptoCurrency.TON}
                                />
                            </DesktopViewHeaderContent.RightItem>
                        </DesktopViewHeaderContent.Right>
                    }
                />
            </DesktopViewHeader>
            <PullToRefresh
                invalidate={[
                    QueryKey.activity,
                    token === CryptoCurrency.TON ? QueryKey.info : QueryKey.jettons
                ]}
            />
            <CoinHeader token={token} />
            <HistorySubheader>{t('page_header_history')}</HistorySubheader>
            <HistoryContainer>
                <DesktopHistory isFetchingNextPage={isFetchingNextPage} activity={activity} />
            </HistoryContainer>
        </DesktopViewPageLayout>
    );
};

const AssetTitle = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;

    ${Body3} {
        color: ${p => p.theme.accentOrange};
    }

    ${p =>
        p.theme.proDisplayType === 'desktop' &&
        css`
            flex-direction: row;
            gap: 12px;
        `}
`;

export const TronUSDTPage = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const asset = TRON_USDT_ASSET;
    const { fiat } = useAppContext();
    const { data: balances } = useTronBalances();
    const { onOpen: sendTransfer } = useSendTransferNotification();

    const usdtBalance = useMemo(() => {
        if (balances === undefined) {
            return undefined;
        }

        if (balances === null) {
            return new AssetAmount({ weiAmount: 0, asset: TRON_USDT_ASSET });
        }

        return balances.usdt;
    }, [balances]);

    const ref = useRef<HTMLDivElement>(null);
    const {
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        data: activity,
        refetch
    } = useFetchFilteredActivity(TRON_USDT_ASSET.address);

    useScrollMonitor(refetch, 5000, ref);

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, true, ref);

    const { data: rate } = useUSDTRate();

    return (
        <DesktopViewPageLayout ref={ref}>
            <DesktopViewHeader backButton borderBottom={true}>
                <DesktopViewHeaderContent
                    title={
                        <LabelWithBadge>
                            {asset.symbol}
                            <AssetBlockchainBadge size="m" marginLeft="6px">
                                TRC20
                            </AssetBlockchainBadge>
                        </LabelWithBadge>
                    }
                    right={
                        <DesktopViewHeaderContent.Right>
                            <DesktopViewHeaderContent.RightItem>
                                <OtherHistoryFilters />
                            </DesktopViewHeaderContent.RightItem>
                        </DesktopViewHeaderContent.Right>
                    }
                />
                {/**/}
            </DesktopViewHeader>
            <PullToRefresh invalidate={[QueryKey.activity, QueryKey.tronAssets]} />
            <CoinHeaderStyled>
                <TronCoinInfoWrapper>
                    <img src={asset.image} alt={asset.symbol} />
                    {usdtBalance !== undefined && (
                        <CoinInfoAmounts>
                            <Num3>{usdtBalance.stringAssetRelativeAmount}</Num3>
                            <Body2>
                                {formatFiatCurrency(
                                    fiat,
                                    usdtBalance.relativeAmount.multipliedBy(rate?.prices ?? 0)
                                )}
                            </Body2>
                        </CoinInfoAmounts>
                    )}
                </TronCoinInfoWrapper>
                <HeaderButtonsContainer>
                    <ButtonStyled
                        size="small"
                        onClick={() => sendTransfer({ chain: BLOCKCHAIN_NAME.TRON })}
                        disabled={usdtBalance?.weiAmount.isZero()}
                    >
                        <ArrowUpIcon />
                        {t('wallet_send')}
                    </ButtonStyled>
                    <ButtonStyled
                        size="small"
                        onClick={() => {
                            sdk.uiEvents.emit('receive', {
                                method: 'receive',
                                params: {
                                    chain: BLOCKCHAIN_NAME.TRON,
                                    jetton: asset.id
                                }
                            });
                        }}
                    >
                        <ArrowDownIcon />
                        {t('wallet_receive')}
                    </ButtonStyled>
                </HeaderButtonsContainer>
            </CoinHeaderStyled>
            <HideOnReview>
                <TronUseBatteryBanner />
            </HideOnReview>
            <HistorySubheader>{t('page_header_history')}</HistorySubheader>
            <HistoryContainer>
                <DesktopHistory isFetchingNextPage={isFetchingNextPage} activity={activity} />
            </HistoryContainer>
        </DesktopViewPageLayout>
    );
};

const TronTopUpUSDTWrapper = styled.div`
    background-color: ${p => p.theme.backgroundContent};
    ${BorderSmallResponsive};
    padding: 16px 14px;
    display: flex;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    margin: 16px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }

    ${p =>
        p.theme.proDisplayType === 'mobile' &&
        css`
            gap: 16px;
            flex-direction: column;

            button {
                width: 100%;
                box-sizing: border-box;
            }
        `}
`;

const TextContainer = styled.div`
    > * {
        display: block;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
    }
`;

const SmallDivider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const LinkStyled = styled(Link)`
    text-decoration: unset;
    color: ${p => p.theme.textPrimary};
    display: contents;
`;

const TronUseBatteryBanner = () => {
    const { t } = useTranslation();
    const { data: batteryBalance } = useBatteryBalance();

    if (batteryBalance && batteryBalance.batteryUnitsBalance.gt(500)) {
        return null;
    }

    return (
        <>
            <TronTopUpUSDTWrapper>
                <TextContainer>
                    <Label2>{t('tron_battery_required_banner_title')}</Label2>
                    <Body2>{t('tron_battery_required_banner_description')}</Body2>
                </TextContainer>
                <LinkStyled
                    to={AppRoute.walletSettings + WalletSettingsRoute.battery}
                    replace={false}
                >
                    <Button primary size="small">
                        {t('tron_battery_required_banner_button')}
                    </Button>
                </LinkStyled>
            </TronTopUpUSDTWrapper>
            <SmallDivider />
        </>
    );
};
