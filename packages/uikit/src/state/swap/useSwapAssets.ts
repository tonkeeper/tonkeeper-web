import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { SwapService } from '@tonkeeper/core/dist/swapsApi';
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

export function useAllSwapAssets() {
    return useQuery<TonAsset[]>({
        queryKey: [QueryKey.swapAllAssets],
        queryFn: async () => {
            const assets = await SwapService.swapAssets();
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
        queryKey: [QueryKey.swapWalletAssets],
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
