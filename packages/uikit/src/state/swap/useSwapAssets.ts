import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Address } from '@ton/core';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { BLOCKCHAIN_NAME, CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useAssets } from '../home';
import BigNumber from 'bignumber.js';
import { useRate } from '../rates';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useAppContext } from '../../hooks/appContext';
import { atom, useAtom } from '../../libs/atom';
import { useMemo } from 'react';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useSwapsConfig } from './useSwapsConfig';
import { JettonsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useWalletJettonList } from '../wallet';

export function useAllSwapAssets() {
    const { swapService } = useSwapsConfig();

    return useQuery<TonAsset[]>({
        queryKey: [QueryKey.swapAllAssets],
        queryFn: async () => {
            const assets = await swapService.swapAssets();
            return assets.map(asset => {
                const address = asset.address === 'ton' ? 'TON' : Address.parse(asset.address);

                return {
                    id: packAssetId(BLOCKCHAIN_NAME.TON, address),
                    symbol: asset.symbol,
                    decimals: asset.decimals,
                    name: asset.name,
                    image: asset.image,
                    blockchain: BLOCKCHAIN_NAME.TON,
                    address
                };
            });
        }
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

export function useWalletSwapAssets() {
    const [walletAssetsData] = useAssets();
    const { data: allAssets } = useAllSwapAssets();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const { fiat } = useAppContext();

    return useQuery<WalletSwapAsset[]>({
        queryKey: [QueryKey.swapWalletAssets, allAssets, walletAssetsData, tonRate, fiat],
        queryFn: async () => {
            if (!walletAssetsData || !allAssets || !tonRate) {
                return [];
            }

            const assetsAmounts = allAssets.map(asset => {
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
            });

            assetsAmounts.sort((a, b) => b.fiatAmount.comparedTo(a.fiatAmount));

            return assetsAmounts;
        },
        enabled: !!walletAssetsData && !!allAssets && !!tonRate
    });
}

export const useWalletFilteredSwapAssets = () => {
    const [filter] = useSwapTokensFilter();
    const { data: walletSwapAssets } = useWalletSwapAssets();

    return useMemo(() => {
        if (!walletSwapAssets) {
            return undefined;
        }

        return walletSwapAssets.filter(swapAsset => {
            if (!filter) {
                return true;
            }

            if (seeIfValidTonAddress(filter)) {
                return Address.parse(filter).equals(swapAsset.assetAmount.asset.address as Address);
            }

            const upperCaseFilter = filter.toUpperCase();

            if (
                swapAsset.assetAmount.asset.symbol.toUpperCase().includes(upperCaseFilter) ||
                swapAsset.assetAmount.asset.name?.toUpperCase().includes(upperCaseFilter)
            ) {
                return true;
            }
        });
    }, [filter, walletSwapAssets]);
};

export const useSwapCustomTokenSearch = () => {
    const [filter] = useSwapTokensFilter();

    const isAddress = seeIfValidTonAddress(filter);
    const { api, fiat } = useAppContext();
    const { data: jettons } = useWalletJettonList();

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
                    image: response.metadata.image,
                    blockchain: BLOCKCHAIN_NAME.TON,
                    name: response.metadata.name,
                    symbol: response.metadata.symbol,
                    decimals: Number(response.metadata.decimals),
                    id: packAssetId(BLOCKCHAIN_NAME.TON, address)
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
