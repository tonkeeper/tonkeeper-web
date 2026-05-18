import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { normalizeSwapDeeplinkToken } from '@tonkeeper/core/dist/service/deeplinkingService';
import {
    isTon,
    shouldHideTonJettonImageCorners,
    TonAsset,
    tonAssetAddressFromString,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { JettonsApi, JettonVerificationType } from '@tonkeeper/core/dist/tonApiV2';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useAtom } from '../../libs/useAtom';
import { QueryKey } from '../../libs/queryKey';
import { useAssets } from '../home';
import { patchedTokenImage, useJettonList } from '../jetton';
import { TokenRate, useRate } from '../rates';
import { fetchSwapAssets } from '@tonkeeper/core/dist/swapsApi';
import type { SwapAsset } from '@tonkeeper/core/dist/swapsApi';
import { useSwapsConfig } from './useSwapsConfig';
import { useActiveApi } from '../wallet';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import { eqAddresses } from '@tonkeeper/core/src/utils/address';
import { KNOWN_TON_ASSETS } from '@tonkeeper/core/src/entries/crypto/asset/constants';
import {
    parseJettonScaledUIMultiplier,
    ScaledUIMultiplier
} from '@tonkeeper/core/dist/entries/crypto/asset/scaled-ui';

export const SWAP_ASSETS_SEARCH_LIMIT = 25;

const toTonAsset = (asset: SwapAsset): TonAsset => {
    const address = asset.address === 'ton' ? 'TON' : Address.parse(asset.address);

    return {
        id: packAssetId(BLOCKCHAIN_NAME.TON, address),
        symbol: asset.symbol,
        decimals: asset.decimals,
        name: asset.name,
        image: patchedTokenImage(tonAssetAddressToString(address), asset.image),
        blockchain: BLOCKCHAIN_NAME.TON,
        noImageCorners: shouldHideTonJettonImageCorners(tonAssetAddressToString(address)),
        scaledUIMultiplier: {
            numerator: '1',
            denominator: '1'
        },
        verification: JettonVerificationType.Whitelist,
        address
    };
};

const filterDisabledAssets = (assets: TonAsset[], enabledUSDe: boolean) => {
    if (enabledUSDe) {
        return assets;
    }

    return assets.filter(
        asset =>
            !eqAddresses(KNOWN_TON_ASSETS.USDe, asset.address) &&
            !eqAddresses(KNOWN_TON_ASSETS.tsUSDe, asset.address)
    );
};

const customAssetMatchesQuery = (asset: TonAsset, query: string) => {
    if (!query) {
        return true;
    }

    if (seeIfValidTonAddress(query)) {
        return Address.isAddress(asset.address) && Address.parse(query).equals(asset.address);
    }

    const upperCaseQuery = query.toUpperCase();
    return (
        asset.symbol.toUpperCase().includes(upperCaseQuery) ||
        asset.name?.toUpperCase().includes(upperCaseQuery)
    );
};

export function useSwapAssetsSearch(
    query: string,
    limit?: number,
    options: { enabled?: boolean; keepPreviousData?: boolean } = {}
) {
    const { baseUrl } = useSwapsConfig();
    const { data: customAssets } = useUserCustomSwapAssets();
    const enabledUSDe = useIsFeatureEnabled(FLAGGED_FEATURE.ETHENA);
    const normalizedQuery = query.trim();

    return useQuery<TonAsset[]>({
        queryKey: [QueryKey.swapAllAssets, normalizedQuery, limit, customAssets, enabledUSDe],
        queryFn: async () => {
            try {
                const assets = await fetchSwapAssets(baseUrl, {
                    q: normalizedQuery || undefined,
                    limit
                });
                const fetchedAssets = assets
                    .map(toTonAsset)
                    .filter(asset => !(customAssets || []).some(ca => ca.id === asset.id));
                const matchingCustomAssets = (customAssets || []).filter(asset =>
                    customAssetMatchesQuery(asset, normalizedQuery)
                );

                return filterDisabledAssets(
                    fetchedAssets.concat(matchingCustomAssets),
                    enabledUSDe
                );
            } catch (e) {
                console.error(e);
                return [];
            }
        },
        enabled: !!baseUrl && !!customAssets && (options.enabled ?? true),
        keepPreviousData: options.keepPreviousData
    });
}

const swapTokensFilter = atom('');

export function useSwapTokensFilter() {
    return useAtom(swapTokensFilter);
}

export type WalletSwapAsset = {
    assetAmount: AssetAmount<TonAsset>;
    fiatAmount: BigNumber;
};

const toWalletSwapAsset = (
    asset: TonAsset,
    walletAssetsData: NonNullable<ReturnType<typeof useAssets>[0]>,
    tonRate: TokenRate,
    fiat: FiatCurrencies
): WalletSwapAsset => {
    if (isTon(asset.address)) {
        return {
            assetAmount: new AssetAmount({
                asset,
                weiAmount: walletAssetsData.ton.info.balance
            }),
            fiatAmount: shiftedDecimals(
                new BigNumber(walletAssetsData.ton.info.balance)
            ).multipliedBy(tonRate.prices)
        };
    }

    const balance = walletAssetsData.ton.jettons.balances.find(j =>
        Address.parse(j.jetton.address).equals(asset.address as Address)
    );

    return {
        assetAmount: new AssetAmount({
            asset,
            weiAmount: balance?.balance || 0
        }),
        fiatAmount: shiftedDecimals(
            new BigNumber(balance?.balance || 0),
            asset.decimals
        ).multipliedBy(new BigNumber(balance?.price?.prices?.[fiat] || 0))
    };
};

export function useWalletSwapAssets(query = '', limit = SWAP_ASSETS_SEARCH_LIMIT) {
    const [walletAssetsData] = useAssets();
    const { data: swapAssets } = useSwapAssetsSearch(query, limit, {
        keepPreviousData: true
    });
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const { fiat } = useAppContext();
    const normalizedQuery = query.trim();

    return useQuery<WalletSwapAsset[]>({
        queryKey: [
            QueryKey.swapWalletAssets,
            normalizedQuery,
            swapAssets,
            walletAssetsData,
            tonRate,
            fiat
        ],
        queryFn: async () => {
            if (!walletAssetsData || !swapAssets || !tonRate) {
                return [];
            }

            const assetsAmounts = swapAssets.map(asset =>
                toWalletSwapAsset(asset, walletAssetsData, tonRate, fiat)
            );

            if (!normalizedQuery) {
                assetsAmounts.sort((a, b) => {
                    if (a.fiatAmount.isZero() && b.fiatAmount.isZero()) {
                        return b.assetAmount.weiAmount.comparedTo(a.assetAmount.weiAmount);
                    }
                    return b.fiatAmount.comparedTo(a.fiatAmount);
                });
            }

            return assetsAmounts;
        },
        enabled: !!walletAssetsData && !!swapAssets && !!tonRate,
        keepPreviousData: true
    });
}

export const useWalletFilteredSwapAssets = (limit = SWAP_ASSETS_SEARCH_LIMIT) => {
    const [filter] = useSwapTokensFilter();

    return useWalletSwapAssets(filter, limit);
};

export const useSwapAssetSearch = (query: string | undefined) => {
    const normalizedQuery = query?.trim() ?? '';
    const { data: swapAssets } = useSwapAssetsSearch(normalizedQuery, 10, {
        enabled: !!normalizedQuery
    });

    return useMemo(() => {
        if (!normalizedQuery) {
            return null;
        }

        if (!swapAssets) {
            return undefined;
        }

        if (seeIfValidTonAddress(normalizedQuery)) {
            const address = Address.parse(normalizedQuery);
            return (
                swapAssets.find(
                    asset => Address.isAddress(asset.address) && address.equals(asset.address)
                ) || null
            );
        }

        const normalizedToken = normalizeSwapDeeplinkToken(normalizedQuery);
        return (
            swapAssets.find(
                asset =>
                    normalizeSwapDeeplinkToken(asset.symbol) === normalizedToken ||
                    normalizeSwapDeeplinkToken(asset.name ?? '') === normalizedToken
            ) || null
        );
    }, [normalizedQuery, swapAssets]);
};

export const useSwapCustomTokenSearch = () => {
    const [filter] = useSwapTokensFilter();

    const isAddress = seeIfValidTonAddress(filter);
    const { fiat } = useAppContext();
    const api = useActiveApi();
    const { data: jettons } = useJettonList();

    return useQuery<WalletSwapAsset | null>({
        queryKey: [QueryKey.swapCustomToken, filter, jettons, fiat],
        queryFn: async () => {
            if (!isAddress) {
                return null;
            }

            try {
                const address = Address.parse(filter);
                const response = await new JettonsApi(api.tonApiV2).getJettonInfo({
                    accountId: address.toRawString()
                });

                const tonAsset: TonAsset = {
                    address,
                    image: response.preview,
                    blockchain: BLOCKCHAIN_NAME.TON,
                    name: response.metadata.name,
                    symbol: response.metadata.symbol,
                    decimals: Number(response.metadata.decimals),
                    id: packAssetId(BLOCKCHAIN_NAME.TON, address),
                    verification: response.verification,
                    scaledUIMultiplier: parseJettonScaledUIMultiplier(response.scaledUi)
                };

                const jb = jettons?.balances.find(j =>
                    Address.parse(j.jetton.address).equals(address)
                );

                const assetAmount = new AssetAmount({
                    asset: tonAsset,
                    weiAmount: jb?.balance || new BigNumber(0)
                });

                return {
                    assetAmount,
                    fiatAmount: shiftedDecimals(
                        new BigNumber(jb?.balance || 0),
                        tonAsset.decimals
                    ).multipliedBy(new BigNumber(jb?.price?.prices?.[fiat] || 0))
                };
            } catch (e) {
                console.error(e);
                return null;
            }
        },
        enabled: isAddress && !!jettons
    });
};

type TonAssetSerialized = {
    address: string;
    image: string;
    blockchain: string;
    name: string;
    symbol: string;
    decimals: number;
    id: string;
    scaledUIMultiplier: ScaledUIMultiplier;
};

export const useUserCustomSwapAssets = () => {
    const sdk = useAppSdk();
    return useQuery<TonAsset[]>([AppKey.SWAP_CUSTOM_ASSETS], async () => {
        const assetsSerialized = await sdk.storage.get<TonAssetSerialized[]>(
            AppKey.SWAP_CUSTOM_ASSETS
        );

        return (
            assetsSerialized?.map(s => ({
                ...s,
                blockchain: s.blockchain as BLOCKCHAIN_NAME.TON,
                address: tonAssetAddressFromString(s.address),
                id: packAssetId(s.blockchain as BLOCKCHAIN_NAME, s.address),
                verification: JettonVerificationType.Whitelist
            })) || []
        );
    });
};

export const useAddUserCustomSwapAsset = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, TonAsset>(async asset => {
        const current =
            (await sdk.storage.get<TonAssetSerialized[]>(AppKey.SWAP_CUSTOM_ASSETS)) || [];
        await sdk.storage.set(AppKey.SWAP_CUSTOM_ASSETS, [
            ...current,
            { ...asset, address: tonAssetAddressToString(asset.address) }
        ]);
        await client.invalidateQueries([AppKey.SWAP_CUSTOM_ASSETS]);
    });
};
