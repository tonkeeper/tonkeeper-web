import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useWalletAccountInfo, useWalletJettonList } from './wallet';
import { TonAsset, legacyTonAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useTronBalances } from './tron';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import { Asset, isAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';

export function useUserAssetBalance<
    T extends AssetIdentification = AssetIdentification,
    R extends Asset = Asset
>(asset: T): { isLoading: boolean; data: T extends Asset ? AssetAmount<R> : string } {
    const jettons = useWalletJettonList();
    const tronBalances = useTronBalances();
    const tonWalletInfo = useWalletAccountInfo();

    let isLoading: boolean;
    let data;

    if (asset.blockchain === BLOCKCHAIN_NAME.TON) {
        if (asset.address === 'TON') {
            isLoading = tonWalletInfo.isLoading;
            data = '1000000000000000'; //tonWalletInfo?.data?.balance || '0';
        } else {
            isLoading = jettons.isLoading;
            data =
                jettons.data?.balances.find(i => i.jettonAddress === legacyTonAssetId(asset))
                    ?.balance || '0';
        }
        if (isAsset(asset)) {
            data = new AssetAmount<TonAsset>({ asset, weiAmount: data });
        }
    } else {
        isLoading = tronBalances.isLoading;
        data =
            tronBalances.data?.balances.find(i => i.token.address === asset.address)?.weiAmount ||
            '0';

        if (isAsset(asset)) {
            data = new AssetAmount<TronAsset>({ asset, weiAmount: data });
        }
    }

    return {
        isLoading,
        data: data as T extends Asset ? AssetAmount<R> : string
    };
}
