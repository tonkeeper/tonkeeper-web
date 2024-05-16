import { useMutation } from '@tanstack/react-query';
import {
    isTon,
    TonAsset,
    TonAssetAddress,
    tonAssetAddressFromString,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { OpenAPI, TradeService } from '@tonkeeper/core/dist/swapsApi';
import { useAppContext } from '../../appContext';
import { JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Address } from '@ton/core';
import { eqAddresses } from '@tonkeeper/core/dist/utils/address';
import { useCallback, useMemo, useState } from 'react';

// TODO
OpenAPI.BASE = 'http://localhost:8080';

export const stonfiNativeAddress = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

export type BasicCalculatedTrade = {
    from: AssetAmount<TonAsset>;
    to: AssetAmount<TonAsset>;
};

export type DedustCalculatedTrade = BasicCalculatedTrade & {
    path: TonAsset[];
    rawTrade: {
        pool: {
            address: string;
        };
        assetIn: string;
        assetOut: string;
        amountIn: string;
        amountOut: string;
    }[];
};

export type DedustCalculatedSwap = {
    type: 'dedust';
    trade: DedustCalculatedTrade | null;
};

export type StonfiCalculatedTrade = BasicCalculatedTrade & {
    rawTrade: {
        ask_address: string;
        ask_units: string;
        offer_address: string;
        offer_units: string;
    };
};

export type StonfiCalculatedSwap = {
    type: 'stonfi';
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
                    const providerSwap = await TradeService.calculateTrade(
                        toTradeAssetId(form.fromAddress),
                        toTradeAssetId(form.toAddress),
                        form.amountWei,
                        provider
                    );

                    const assetsToQuery = new Set<string>();
                    if (providerSwap.type === 'dedust') {
                        providerSwap.trades.forEach(steps =>
                            steps.forEach(step => {
                                assetsToQuery.add(
                                    tonAssetAddressToString(fromDedustAddress(step.assetIn))
                                );
                                assetsToQuery.add(
                                    tonAssetAddressToString(fromDedustAddress(step.assetOut))
                                );
                            })
                        );
                    }
                    if (providerSwap.type === 'stonfi') {
                        if (providerSwap.trade) {
                            assetsToQuery.add(
                                tonAssetAddressToString(
                                    fromStonfiAddress(providerSwap.trade.ask_address)
                                )
                            );
                            assetsToQuery.add(
                                tonAssetAddressToString(
                                    fromStonfiAddress(providerSwap.trade.offer_address)
                                )
                            );
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
                        type: provider,
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
    return isTon(address) ? 'native' : address.toRawString();
};

const fromDedustAddress = (address: string) => {
    if (address === 'native') {
        return 'TON';
    }

    return Address.parse(address.split('jetton:')[1]);
};

const fromStonfiAddress = (address: string) => {
    if (eqAddresses(address, stonfiNativeAddress)) {
        return 'TON';
    }

    return Address.parse(address);
};

const providerSwapToSwap = (
    providerSwap: Awaited<ReturnType<typeof TradeService.calculateTrade>>,
    assetsInfo: TonAsset[]
): CalculatedSwap[] => {
    if (providerSwap.type === 'dedust') {
        return providerSwap.trades.map(steps => ({
            type: 'dedust',
            trade: {
                from: new AssetAmount({
                    asset: assetsInfo.find(a =>
                        eqAddresses(a.address, fromDedustAddress(steps[0].assetIn))
                    )!,
                    weiAmount: steps[0].amountIn
                }),
                to: new AssetAmount({
                    asset: assetsInfo.find(a =>
                        eqAddresses(a.address, fromDedustAddress(steps[steps.length - 1].assetOut))
                    )!,
                    weiAmount: steps[steps.length - 1].amountOut
                }),
                path: steps.reduce((acc, s, index) => {
                    acc.push(
                        assetsInfo.find(a => eqAddresses(a.address, fromDedustAddress(s.assetIn)))!
                    );
                    if (index === steps.length - 1) {
                        acc.push(
                            assetsInfo.find(a =>
                                eqAddresses(a.address, fromDedustAddress(s.assetOut))
                            )!
                        );
                    }

                    return acc;
                }, [] as TonAsset[]),
                rawTrade: steps
            }
        }));
    }

    if (providerSwap.type === 'stonfi') {
        const trade = providerSwap.trade;
        if (!trade) {
            return [{ type: 'stonfi', trade: null }];
        }
        return [
            {
                type: 'stonfi',
                trade: {
                    from: new AssetAmount({
                        asset: assetsInfo.find(a =>
                            eqAddresses(a.address, fromStonfiAddress(trade.offer_address))
                        )!,
                        weiAmount: trade.offer_units
                    }),
                    to: new AssetAmount({
                        asset: assetsInfo.find(a =>
                            eqAddresses(a.address, fromStonfiAddress(trade.ask_address))
                        )!,
                        weiAmount: trade.ask_units
                    }),
                    rawTrade: trade
                }
            }
        ];
    }

    return [];
};
