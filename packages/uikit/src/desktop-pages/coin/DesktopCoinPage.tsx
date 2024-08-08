import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { tonAssetAddressFromString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { FC, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, SwapIcon } from '../../components/Icon';
import { Body2, Label2, Num3 } from '../../components/Text';
import {
    DesktopViewHeader,
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
import { AppRoute } from '../../libs/routes';
import { useFetchFilteredActivity } from '../../state/activity';
import { useAssets } from '../../state/home';
import { getMixedActivity } from '../../state/mixedActivity';
import { useRate } from '../../state/rates';
import { useAllSwapAssets } from '../../state/swap/useSwapAssets';
import { useSwapFromAsset } from '../../state/swap/useSwapForm';
import { useTonendpointBuyMethods } from '../../state/tonendpoint';
import { useIsActiveWalletWatchOnly } from '../../state/wallet';

export const DesktopCoinPage = () => {
    const navigate = useNavigate();
    const { name } = useParams();

    useEffect(() => {
        if (!name) {
            navigate(AppRoute.home);
        }
    }, [name]);

    if (!name) return <></>;

    const token = name === 'ton' ? CryptoCurrency.TON : name;

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
    const isReadOnly = useIsActiveWalletWatchOnly();
    const { data: buy } = useTonendpointBuyMethods();
    const canBuy = token === CryptoCurrency.TON;
    const { data: swapAssets } = useAllSwapAssets();

    const currentAssetAddress = tonAssetAddressFromString(token);
    const swapAsset = isReadOnly
        ? undefined
        : swapAssets?.find(a => eqAddresses(a.address, currentAssetAddress));

    const [_, setSwapFromAsset] = useSwapFromAsset();
    const navigate = useNavigate();

    const onSwap = () => {
        setSwapFromAsset(swapAsset!);
        navigate(AppRoute.swap);
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
                                params: { asset: token, chain: BLOCKCHAIN_NAME.TON }
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
                            params: {}
                        });
                    }}
                >
                    <ArrowDownIcon />
                    {t('wallet_receive')}
                </ButtonStyled>
                {swapAsset && (
                    <ButtonStyled size="small" onClick={onSwap}>
                        <SwapIcon />
                        {t('wallet_swap')}
                    </ButtonStyled>
                )}
                {canBuy && (
                    <ButtonStyled size="small" onClick={onOpen}>
                        <PlusIcon />
                        {t('wallet_buy')}
                    </ButtonStyled>
                )}
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

    const asset: { symbol: string; image: string; amount: string; fiatAmount: string } | undefined =
        useMemo(() => {
            if (!assets || !rate) {
                return undefined;
            }

            if (token === CryptoCurrency.TON) {
                const amount = assets.ton.info.balance;
                return {
                    image: 'https://wallet.tonkeeper.com/img/toncoin.svg',
                    symbol: 'TON',
                    amount: format(amount),
                    fiatAmount: formatFiatCurrency(
                        fiat,
                        new BigNumber(rate.prices).multipliedBy(shiftedDecimals(amount))
                    )
                };
            }

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
                    new BigNumber(rate.prices || 0).multipliedBy(
                        shiftedDecimals(jettonBalance.balance, jettonBalance.jetton.decimals)
                    )
                )
            };
        }, [assets, format, rate, fiat]);

    if (!asset) {
        return <></>;
    }

    return (
        <CoinInfoWrapper>
            <img src={asset.image} alt={asset.symbol} />
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
    overflow-x: auto;
`;

export const CoinPage: FC<{ token: string }> = ({ token }) => {
    const { t } = useTranslation();
    const ref = useRef<HTMLDivElement>(null);

    const { standalone } = useAppContext();

    const { fetchNextPage, hasNextPage, isFetchingNextPage, data } =
        useFetchFilteredActivity(token);

    useFetchNext(hasNextPage, isFetchingNextPage, fetchNextPage, standalone, ref);

    const activity = useMemo(() => {
        return getMixedActivity(data, undefined);
    }, [data]);

    const [assets] = useAssets();
    const assetSymbol = useMemo(() => {
        if (!assets) {
            return undefined;
        }
        if (token === CryptoCurrency.TON) {
            return t('Toncoin');
        }

        return assets.ton.jettons.balances.find(b => eqAddresses(b.jetton.address, token))?.jetton
            .symbol;
    }, [assets, t, token]);

    return (
        <DesktopViewPageLayout ref={ref}>
            <DesktopViewHeader backButton borderBottom={true}>
                <Label2>{assetSymbol || 'Unknown asset'}</Label2>
            </DesktopViewHeader>
            <CoinHeader token={token} />
            <HistorySubheader>{t('page_header_history')}</HistorySubheader>
            <HistoryContainer>
                <DesktopHistory isFetchingNextPage={isFetchingNextPage} activity={activity} />
            </HistoryContainer>
        </DesktopViewPageLayout>
    );
};
