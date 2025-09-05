import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import { isBasicAsset, packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import {
    KNOWN_TON_ASSETS,
    TON_ASSET,
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset, legacyTonAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { DashboardCellNumeric } from '@tonkeeper/core/dist/entries/dashboard';
import { getDashboardData } from '@tonkeeper/core/dist/service/proService';
import { JettonBalance } from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useAppContext } from '../hooks/appContext';
import { QueryKey } from '../libs/queryKey';
import { useUserFiat } from './fiat';
import { useAssets } from './home';
import { useJettonList } from './jetton';
import {
    getJettonsFiatAmount,
    tokenRate as getTokenRate,
    getTonFiatAmount,
    toTokenRate,
    useRate,
    useUSDTRate
} from './rates';
import { useTronBalances } from './tron/tron';
import { useAccountsState, useActiveAccount, useWalletAccountInfo } from './wallet';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { getNetworkByAccount } from '@tonkeeper/core/dist/entries/account';
import { useAppSdk } from '../hooks/appSdk';

export function useUserAssetBalance<
    T extends AssetIdentification = AssetIdentification,
    R extends Asset = Asset
>(asset: T): { isLoading: boolean; data: T extends Asset ? AssetAmount<R> : string } {
    const jettons = useJettonList();
    const tronBalances = useTronBalances();
    const tonWalletInfo = useWalletAccountInfo();

    let isLoading: boolean;
    let data;

    if (asset.blockchain === BLOCKCHAIN_NAME.TON) {
        if (asset.address === 'TON') {
            isLoading = tonWalletInfo.isLoading;
            data = tonWalletInfo?.data?.balance || '0';
        } else if (Address.isAddress(asset.address)) {
            isLoading = jettons.isLoading;
            data =
                jettons.data?.balances.find(i => i.jetton.address === legacyTonAssetId(asset))
                    ?.balance || '0';
        } else {
            isLoading = tonWalletInfo.isLoading;
            const extra = tonWalletInfo.data?.extraBalance?.find(
                item => item.preview.symbol === asset.address
            );
            data = extra?.amount || '0';
        }
        if (isBasicAsset(asset)) {
            data = new AssetAmount<TonAsset>({ asset: asset as TonAsset, weiAmount: data });
        }
    } else {
        isLoading = tronBalances.isLoading;
        if (asset.address === TRON_USDT_ASSET.address) {
            data = tronBalances.data?.usdt;
        } else if (asset.address === TRON_TRX_ASSET.address) {
            data = tronBalances.data?.trx;
        } else {
            data = '0';
        }
    }

    return {
        isLoading,
        data: data as T extends Asset ? AssetAmount<R> : string
    };
}

export function useAssetImage(asset: Asset): string | undefined {
    return asset.image;
}

export function useTonAssetImage({ blockchain, address }: AssetIdentification): string | undefined {
    const id = packAssetId(blockchain, address);
    const { data: jettons } = useJettonList();

    if (id === TON_ASSET.id) {
        return TON_ASSET.image;
    }

    if (typeof address === 'string') {
        throw new Error('Unexpected address');
    }

    return jettons?.balances.find(i => address.equals(Address.parse(i.jetton.address)))?.jetton
        .image;
}

export function useAssetAmountFiatEquivalent(assetAmount: AssetAmount): {
    isLoading: boolean;
    data: BigNumber | undefined;
} {
    let assetId: string;
    if (assetAmount.asset.id === TRON_USDT_ASSET.id) {
        assetId = 'USDT';
    } else if (assetAmount.asset.id === TRON_TRX_ASSET.id) {
        assetId = 'TRX';
    } else {
        assetId = legacyTonAssetId(assetAmount.asset as TonAsset, { userFriendly: true });
    }
    const { data: tokenRate, isLoading } = useRate(assetId);

    return {
        isLoading,
        data:
            tokenRate?.prices !== undefined
                ? assetAmount.relativeAmount.multipliedBy(tokenRate.prices)
                : undefined
    };
}

function tokenColor(tokenAddress: string) {
    if (tokenAddress === 'TON') {
        return '#0098EA';
    }

    const address = Address.parse(tokenAddress);

    if (address.equals(KNOWN_TON_ASSETS.jUSDT)) {
        return '#2AAF86';
    }

    const addressId = Number('0x' + address.toRawString().slice(-10));

    const restColors = [
        '#FF8585',
        '#FFA970',
        '#FFC95C',
        '#85CC7A',
        '#70A0FF',
        '#6CCCF5',
        '#AD89F5',
        '#F57FF5',
        '#F576B1',
        '#293342'
    ];

    return restColors[addressId % restColors.length];
}

export const useWalletTotalBalance = () => {
    const [assets] = useAssets();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const fiat = useUserFiat();

    const { data: tronBalances } = useTronBalances();
    const { data: usdtRate } = useUSDTRate();

    const client = useQueryClient();
    return useQuery<BigNumber>(
        [QueryKey.total, fiat, assets, tonRate],
        () => {
            if (!assets) {
                return new BigNumber(0);
            }
            const tonAssetsAmount = getTonFiatAmount(client, fiat, assets).plus(
                getJettonsFiatAmount(fiat, assets)
            );

            if (!tronBalances || !usdtRate?.prices) {
                return tonAssetsAmount;
            }

            return tonAssetsAmount.plus(
                tronBalances.usdt.relativeAmount.multipliedBy(usdtRate.prices)
            );
        },
        { enabled: !!assets && !!tonRate && !!usdtRate && tronBalances !== undefined }
    );
};

export const useAllWalletsTotalBalance = (network: Network) => {
    const sdk = useAppSdk();
    const fiat = useUserFiat();
    const allAccounts = useAccountsState();
    const allWalletsAddresses = useMemo(
        () =>
            allAccounts
                .filter(acc => getNetworkByAccount(acc) === network)
                .flatMap(acc => acc.allTonWallets)
                .map(w => w.rawAddress),
        [allAccounts]
    );

    return useQuery<BigNumber>(
        [QueryKey.allWalletsTotalBalance, fiat, allWalletsAddresses],
        async () => {
            const queryToFetch = {
                accounts: allWalletsAddresses,
                columns: ['total_balance']
            };
            const result = await getDashboardData(queryToFetch, {
                currency: fiat,
                token: await sdk.subscriptionService.getToken()
            });

            return result
                .map(row => new BigNumber((row.cells[0] as DashboardCellNumeric).value))
                .reduce((v, acc) => acc.plus(v), new BigNumber(0));
        }
    );
};

export const useAccountTotalBalance = () => {
    const sdk = useAppSdk();
    const fiat = useUserFiat();
    const account = useActiveAccount();
    const allWalletsAddresses = useMemo(
        () => account.allTonWallets.map(w => w.rawAddress),
        [account]
    );
    const { data: tronBalances } = useTronBalances();
    const { data: rate } = useUSDTRate();

    return useQuery<BigNumber>(
        [QueryKey.allWalletsTotalBalance, fiat, allWalletsAddresses],
        async () => {
            const queryToFetch = {
                accounts: allWalletsAddresses,
                columns: ['total_balance']
            };
            const result = await getDashboardData(queryToFetch, {
                currency: fiat,
                token: await sdk.subscriptionService.getToken()
            });

            const totalTonAssetsBalances = result
                .map(row => new BigNumber((row.cells[0] as DashboardCellNumeric).value))
                .reduce((v, acc) => acc.plus(v), new BigNumber(0));

            if (!tronBalances) {
                return totalTonAssetsBalances;
            }

            return totalTonAssetsBalances.plus(
                tronBalances.usdt.relativeAmount.multipliedBy(rate?.prices ?? 0)
            );
        },
        { enabled: tronBalances !== undefined && rate !== undefined }
    );
};

export interface TokenMeta {
    address: string;
    name: string;
    symbol: string;
    color: string;
    image: string;
    balance: BigNumber;
    price: number;
}

export interface TokenDistribution {
    percent: number;
    fiatBalance: BigNumber;
    meta:
        | TokenMeta
        | {
              type: 'others';
              color: string;
              tokens: TokenMeta[];
          };
}

export function useAssetsDistribution(maxGropusNumber = 10) {
    const [assets] = useAssets();
    const { fiat } = useAppContext();
    const { data: tonRate } = useRate(CryptoCurrency.TON);

    const client = useQueryClient();
    return useQuery<TokenDistribution[]>(
        [QueryKey.distribution, fiat, assets, tonRate, maxGropusNumber],
        () => {
            if (!assets) {
                return [];
            }

            const ton: Omit<TokenDistribution, 'percent'> = {
                fiatBalance: getTonFiatAmount(client, fiat, assets),
                meta: convertJettonToTokenMeta(
                    { isNative: true, balance: assets.ton.info.balance },
                    getTokenRate(client, fiat, CryptoCurrency.TON)?.prices || 0
                )
            };

            const tokensOmited: Omit<TokenDistribution, 'percent'>[] = [ton].concat(
                assets.ton.jettons.balances.map(b => {
                    const price = b.price ? toTokenRate(b.price, fiat).prices : 0;
                    const fiatBalance = shiftedDecimals(b.balance, b.jetton.decimals).multipliedBy(
                        price
                    );

                    return {
                        fiatBalance,
                        meta: convertJettonToTokenMeta(b, price)
                    };
                })
            );

            if (assets.ton.info.extraBalance) {
                for (const extra of assets.ton.info.extraBalance) {
                    // TODO: Extra Currency token rate
                    const dist: Omit<TokenDistribution, 'percent'> = {
                        fiatBalance: new BigNumber(0),
                        meta: convertJettonToTokenMeta(
                            { isNative: true, balance: Number(extra.amount) },
                            0
                        )
                    };
                    tokensOmited.push(dist);
                }
            }

            const total = tokensOmited.reduce(
                (acc, t) => t.fiatBalance.plus(acc),
                new BigNumber(0)
            );

            tokensOmited.sort((a, b) => b.fiatBalance.minus(a.fiatBalance).toNumber());

            const tokens: TokenDistribution[] = tokensOmited
                .map(t => ({
                    ...t,
                    percent: t.fiatBalance
                        .dividedBy(total)
                        .multipliedBy(100)
                        .decimalPlaces(2)
                        .toNumber()
                }))
                .filter(t => t.percent > 0);

            const tokensToDisplay = tokens.slice(0, maxGropusNumber - 1);

            const includedPercent = tokensToDisplay.reduce((acc, t) => t.percent + acc, 0);
            const includedBalance = tokensToDisplay.reduce(
                (acc, t) => t.fiatBalance.plus(acc),
                new BigNumber(0)
            );

            if (tokens.length > maxGropusNumber) {
                tokensToDisplay.push({
                    percent: new BigNumber(100 - includedPercent).decimalPlaces(2).toNumber(),
                    fiatBalance: total.minus(includedBalance),
                    meta: {
                        type: 'others',
                        color: '#9DA2A4',
                        tokens: tokens.slice(maxGropusNumber - 1).map(t => t.meta) as TokenMeta[]
                    }
                });
            }

            return tokensToDisplay;
        },
        { enabled: !!assets && !!tonRate }
    );
}

function convertJettonToTokenMeta(
    asset: JettonBalance | { isNative: true; balance: number },
    price: number
): TokenMeta {
    if ('isNative' in asset) {
        return {
            address: 'TON',
            name: 'TON',
            symbol: 'TON',
            color: tokenColor('TON'),
            image: 'https://wallet.tonkeeper.com/img/toncoin.svg',
            price,
            balance: new BigNumber(asset.balance)
        };
    }

    return {
        address: asset.jetton.address,
        name: asset.jetton.name,
        symbol: asset.jetton.symbol,
        color: tokenColor(asset.jetton.address),
        image: asset.jetton.image,
        balance: new BigNumber(asset.balance),
        price
    };
}
