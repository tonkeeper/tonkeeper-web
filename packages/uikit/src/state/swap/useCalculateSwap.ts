import { useMutation } from '@tanstack/react-query';
import {
    isTon,
    TonAsset,
    TonAssetAddress,
    tonAssetAddressFromString,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { OpenAPI, SwapService } from '@tonkeeper/core/dist/swapsApi';
import { JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Address } from '@ton/core';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useCallback, useMemo, useState } from 'react';
import { useAppContext } from '../../hooks/appContext';

// TODO
OpenAPI.BASE = 'http://localhost:8080';

export type BasicCalculatedTrade = {
    from: AssetAmount<TonAsset>;
    to: AssetAmount<TonAsset>;
};

export type DedustCalculatedTrade = BasicCalculatedTrade & {
    path: TonAsset[];
    rawTrade: {
        fromAsset: string;
        toAsset: string;
        fromAmount: string;
        toAmount: string;
        poolAddress: string;
    }[];
};

export type DedustCalculatedSwap = {
    provider: 'dedust';
    trade: DedustCalculatedTrade | null;
};

export type StonfiCalculatedTrade = BasicCalculatedTrade & {
    rawTrade: {
        fromAsset: string;
        toAsset: string;
        fromAmount: string;
        toAmount: string;
    };
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

export function useCalculateSwap() {
    const { api } = useAppContext();

    const getAsset = async (address: TonAssetAddress): Promise<TonAsset> => {
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

    const [fetchedSwaps, setFetchedSwaps] = useState<CalculatedSwap[]>([]);
    const mutation = useMutation<CalculatedSwap[], Error, CalculateTradeForm>(async form => {
        setFetchedSwaps([]);
        getAsset(form.fromAddress);
        getAsset(form.toAddress);

        let totalFetchedSwaps: CalculatedSwap[] = [];
        return new Promise(res => {
            let fetchedProvidersNumber = 0;
            swapProviders.forEach(async provider => {
                try {
                    const providerSwap = await SwapService.calculateSwap(
                        toTradeAssetId(form.fromAddress),
                        toTradeAssetId(form.toAddress),
                        form.amountWei,
                        provider
                    );

                    const assetsToQuery = new Set<string>();
                    if (providerSwap.provider === 'dedust') {
                        providerSwap.trades.forEach(t =>
                            t.steps.forEach(step => {
                                assetsToQuery.add(
                                    tonAssetAddressToString(fromTradeAssetId(step.fromAsset))
                                );
                                assetsToQuery.add(
                                    tonAssetAddressToString(fromTradeAssetId(step.toAsset))
                                );
                            })
                        );
                    }
                    if (providerSwap.provider === 'stonfi') {
                        const t = providerSwap.trades[0];
                        if (t) {
                            assetsToQuery.add(
                                tonAssetAddressToString(fromTradeAssetId(t.fromAsset))
                            );
                            assetsToQuery.add(tonAssetAddressToString(fromTradeAssetId(t.toAsset)));
                        }
                    }
                    const assetsInfo = await Promise.all(
                        [...assetsToQuery.values()].map(a => getAsset(tonAssetAddressFromString(a)))
                    );

                    const swap = providerSwapToSwap(providerSwap, assetsInfo);

                    totalFetchedSwaps = totalFetchedSwaps.concat(swap);
                    setFetchedSwaps(s => [...s, ...swap]);

                    fetchedProvidersNumber = fetchedProvidersNumber + 1;
                    if (fetchedProvidersNumber === swapProviders.length) {
                        res(totalFetchedSwaps);
                    }
                } catch (e) {
                    console.error(e);
                    const swap: CalculatedSwap = {
                        provider: provider as 'dedust' | 'stonfi',
                        trade: null
                    };
                    totalFetchedSwaps = totalFetchedSwaps.concat(swap);
                    setFetchedSwaps(s => [...s, swap]);

                    fetchedProvidersNumber = fetchedProvidersNumber + 1;
                    if (fetchedProvidersNumber === swapProviders.length) {
                        res(totalFetchedSwaps);
                    }
                }
            });
        });
    });

    const reset = useCallback(() => {
        setFetchedSwaps([]);
        mutation.reset();
    }, [mutation.reset, setFetchedSwaps]);

    return useMemo(
        () => ({
            ...mutation,
            fetchedSwaps,
            reset
        }),
        [mutation, fetchedSwaps, reset]
    );
}

const toTradeAssetId = (address: TonAssetAddress) => {
    return isTon(address) ? 'ton' : address.toRawString();
};

const fromTradeAssetId = (address: string): TonAssetAddress => {
    return address === 'ton' ? 'TON' : Address.parse(address);
};

const providerSwapToSwap = (
    providerSwap: Awaited<ReturnType<typeof SwapService.calculateSwap>>,
    assetsInfo: TonAsset[]
): CalculatedSwap[] => {
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
                    asset: assetsInfo.find(a =>
                        eqAddresses(a.address, fromTradeAssetId(t.steps[0].fromAsset))
                    )!,
                    weiAmount: t.steps[0].fromAmount
                }),
                to: new AssetAmount({
                    asset: assetsInfo.find(a =>
                        eqAddresses(
                            a.address,
                            fromTradeAssetId(t.steps[t.steps.length - 1].toAsset)
                        )
                    )!,
                    weiAmount: t.steps[t.steps.length - 1].toAmount
                }),
                path: t.steps.reduce((acc, s, index) => {
                    acc.push(
                        assetsInfo.find(a => eqAddresses(a.address, fromTradeAssetId(s.fromAsset)))!
                    );
                    if (index === t.steps.length - 1) {
                        acc.push(
                            assetsInfo.find(a =>
                                eqAddresses(a.address, fromTradeAssetId(s.toAsset))
                            )!
                        );
                    }

                    return acc;
                }, [] as TonAsset[]),
                rawTrade: t.steps
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
                        asset: assetsInfo.find(a =>
                            eqAddresses(a.address, fromTradeAssetId(trade.fromAsset))
                        )!,
                        weiAmount: trade.fromAmount
                    }),
                    to: new AssetAmount({
                        asset: assetsInfo.find(a =>
                            eqAddresses(a.address, fromTradeAssetId(trade.toAsset))
                        )!,
                        weiAmount: trade.toAmount
                    }),
                    rawTrade: trade
                }
            }
        ];
    }

    return [];
};
