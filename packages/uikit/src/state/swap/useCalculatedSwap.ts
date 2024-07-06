import { useQuery } from '@tanstack/react-query';
import {
    isTon,
    TonAsset,
    TonAssetAddress
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import type { SwapService } from '@tonkeeper/core/dist/swapsApi';
import { JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Address } from '@ton/core';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useMemo } from 'react';
import { useAppContext } from '../../hooks/appContext';
import {
    useSwapFromAmount,
    useSwapFromAsset,
    useSelectedSwap,
    useSwapToAsset,
    useIsSwapFormNotCompleted
} from './useSwapForm';
import { QueryKey } from '../../libs/queryKey';
import { unShiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { atom, useAtom } from '../../libs/atom';
import { useSwapsConfig } from './useSwapsConfig';

export type BasicCalculatedTrade = {
    from: AssetAmount<TonAsset>;
    to: AssetAmount<TonAsset>;
    blockchainFee: AssetAmount<typeof TON_ASSET>;
};

export type DedustCalculatedTrade = BasicCalculatedTrade & {
    path: TonAsset[];
    rawTrade: unknown;
};

export type DedustCalculatedSwap = {
    provider: 'dedust';
    trade: DedustCalculatedTrade | null;
};

export type StonfiCalculatedTrade = BasicCalculatedTrade & {
    path: TonAsset[];
    rawTrade: unknown;
};

export type StonfiCalculatedSwap = {
    provider: 'stonfi';
    trade: StonfiCalculatedTrade | null;
};

export type CalculatedSwap = DedustCalculatedSwap | StonfiCalculatedSwap;

export type CalculateTradeForm = {
    fromAddress: TonAssetAddress;
    toAddress: TonAssetAddress;
    amountWei: string;
};

const swapAssetsCache = new Map<TonAssetAddress, Promise<TonAsset>>();

export const swapProviders = ['stonfi', 'dedust'] as const;

const fetchedSwaps$ = atom<CalculatedSwap[]>([]);

let calculationId = 0;

export function useCalculatedSwap() {
    const { api } = useAppContext();

    const [fetchedSwaps, setFetchedSwaps] = useAtom(fetchedSwaps$);
    const [fromAsset] = useSwapFromAsset();
    const [toAsset] = useSwapToAsset();
    const [fromAmountRelative] = useSwapFromAmount();
    const [_, setSelectedSwap] = useSelectedSwap();
    const isNotCompleted = useIsSwapFormNotCompleted();
    const { swapService } = useSwapsConfig();

    const query = useQuery<CalculatedSwap[], Error>({
        queryKey: [
            QueryKey.swapCalculate,
            fromAsset.id,
            toAsset.id,
            fromAmountRelative?.shiftedBy(fromAsset.decimals).toFixed(0)
        ],
        queryFn: async ({ signal }) => {
            setFetchedSwaps([]);
            setSelectedSwap(undefined);
            calculationId = calculationId + 1;
            const currentCalulationId = calculationId;

            if (isNotCompleted) {
                return [];
            }

            addAssetToCache(fromAsset);
            addAssetToCache(toAsset);

            const fromAmountWei = unShiftedDecimals(fromAmountRelative!, fromAsset.decimals);

            let totalFetchedSwaps: CalculatedSwap[] = [];
            return new Promise((res, rej) => {
                let fetchedProvidersNumber = 0;
                swapProviders.forEach(async provider => {
                    try {
                        const swapPromise = swapService.calculateSwap(
                            toTradeAssetId(fromAsset.address),
                            toTradeAssetId(toAsset.address),
                            fromAmountWei.toFixed(0),
                            provider
                        );

                        if (signal) {
                            signal.onabort = () => swapPromise.cancel();
                        }

                        const providerSwap = await swapPromise;

                        const swap = await providerSwapToSwap(
                            providerSwap,
                            api,
                            fromAsset,
                            toAsset
                        );

                        if (currentCalulationId !== calculationId) {
                            rej(new Error('Calculation cancelled'));
                            return;
                        }

                        const providerBestSwap = sortSwaps(swap)[0];

                        totalFetchedSwaps = sortSwaps(totalFetchedSwaps.concat(providerBestSwap));
                        if (totalFetchedSwaps[0].trade) {
                            setSelectedSwap(totalFetchedSwaps[0]);
                        }
                        setFetchedSwaps(s => sortSwaps([...s, providerBestSwap]));

                        fetchedProvidersNumber = fetchedProvidersNumber + 1;
                        if (fetchedProvidersNumber === swapProviders.length) {
                            res(totalFetchedSwaps);
                        }
                    } catch (e) {
                        if (currentCalulationId !== calculationId) {
                            rej(new Error('Calculation cancelled'));
                            return;
                        }

                        console.error(e);
                        const swap: CalculatedSwap = {
                            provider,
                            trade: null
                        };
                        totalFetchedSwaps = sortSwaps(totalFetchedSwaps.concat(swap));
                        if (totalFetchedSwaps[0].trade) {
                            setSelectedSwap(totalFetchedSwaps[0]);
                        }
                        setFetchedSwaps(s => sortSwaps([...s, swap]));

                        fetchedProvidersNumber = fetchedProvidersNumber + 1;
                        if (fetchedProvidersNumber === swapProviders.length) {
                            res(totalFetchedSwaps);
                        }
                    }
                });
            });
        },
        cacheTime: 0
    });

    return useMemo(
        () => ({
            ...query,
            fetchedSwaps
        }),
        [query, fetchedSwaps]
    );
}

const toTradeAssetId = (address: TonAssetAddress) => {
    return isTon(address) ? 'ton' : address.toRawString();
};

const fromTradeAssetId = (address: string): TonAssetAddress => {
    return address === 'ton' ? 'TON' : Address.parse(address);
};

const sortSwaps = (swaps: CalculatedSwap[]) => {
    return swaps.slice().sort((a, b) => {
        if (!a.trade) {
            return 1;
        }

        if (!b.trade) {
            return -1;
        }

        return b.trade.to.weiAmount.comparedTo(a.trade.to.weiAmount);
    });
};

const providerSwapToSwap = async (
    providerSwap: Awaited<ReturnType<typeof SwapService.calculateSwap>>,
    api: APIConfig,
    fromAsset: TonAsset,
    toAsset: TonAsset
): Promise<CalculatedSwap[]> => {
    const assetsInfo = await getPathAssets(providerSwap.trades, api);

    if (providerSwap.provider === 'dedust') {
        if (providerSwap.trades.length === 0) {
            return [
                {
                    provider: 'dedust',
                    trade: null
                }
            ];
        }

        return providerSwap.trades.map(t => ({
            provider: 'dedust',
            trade: {
                from: new AssetAmount({
                    asset: fromAsset,
                    weiAmount: t.fromAmount
                }),
                to: new AssetAmount({
                    asset: toAsset,
                    weiAmount: t.toAmount
                }),
                path: t.path.map(
                    address =>
                        assetsInfo.find(a => eqAddresses(a.address, fromTradeAssetId(address)))!
                ),
                blockchainFee: new AssetAmount({
                    asset: TON_ASSET,
                    weiAmount: t.blockchainFee
                }),
                rawTrade: t.dedustRawTrade
            }
        }));
    }

    if (providerSwap.provider === 'stonfi') {
        const trade = providerSwap.trades[0];
        if (!trade) {
            return [{ provider: 'stonfi', trade: null }];
        }
        return [
            {
                provider: 'stonfi',
                trade: {
                    from: new AssetAmount({
                        asset: fromAsset,
                        weiAmount: trade.fromAmount
                    }),
                    to: new AssetAmount({
                        asset: toAsset,
                        weiAmount: trade.toAmount
                    }),
                    blockchainFee: new AssetAmount({
                        asset: TON_ASSET,
                        weiAmount: trade.blockchainFee
                    }),
                    rawTrade: trade.stonfiRawTrade,
                    path: trade.path.map(
                        address =>
                            assetsInfo.find(a => eqAddresses(a.address, fromTradeAssetId(address)))!
                    )
                }
            }
        ];
    }

    return [];
};

const getPathAssets = async (trades: { path: string[] }[], api: APIConfig) => {
    const addresses = trades.flatMap(trade => trade.path.map(fromTradeAssetId));

    return Promise.all(addresses.map(address => getAsset(api, address)));
};

const addAssetToCache = (asset: TonAsset) => {
    if (!swapAssetsCache.has(asset.address)) {
        swapAssetsCache.set(asset.address, Promise.resolve(asset));
    }
};

const getAsset = async (api: APIConfig, address: TonAssetAddress): Promise<TonAsset> => {
    if (isTon(address)) {
        return TON_ASSET;
    }

    if (swapAssetsCache.has(address)) {
        return swapAssetsCache.get(address)!;
    }

    const tonapi = new JettonsApi(api.tonApiV2);
    const p = tonapi.getJettonInfo({ accountId: address.toRawString() }).then(
        response =>
            ({
                symbol: response.metadata.symbol,
                decimals: Number(response.metadata.decimals),
                name: response.metadata.name,
                blockchain: BLOCKCHAIN_NAME.TON,
                address,
                id: packAssetId(BLOCKCHAIN_NAME.TON, address),
                image: response.metadata.image
            } as const)
    );
    swapAssetsCache.set(address, p);
    return p;
};
