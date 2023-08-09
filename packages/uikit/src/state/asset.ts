import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import { isBasicAsset, packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset, legacyTonAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import BigNumber from 'bignumber.js';
import { Address } from 'ton-core';
import { useRate } from './rates';
import { useTronBalances } from './tron/tron';
import { useWalletAccountInfo, useWalletJettonList } from './wallet';

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
            data = tonWalletInfo?.data?.balance || '0';
        } else {
            isLoading = jettons.isLoading;
            data =
                jettons.data?.balances.find(i => i.jettonAddress === legacyTonAssetId(asset))
                    ?.balance || '0';
        }
        if (isBasicAsset(asset)) {
            data = new AssetAmount<TonAsset>({ asset, weiAmount: data });
        }
    } else {
        isLoading = tronBalances.isLoading;
        data =
            tronBalances.data?.balances.find(i => i.token.address === asset.address)?.weiAmount ||
            '0';

        if (isBasicAsset(asset)) {
            data = new AssetAmount<TronAsset>({ asset, weiAmount: data });
        }
    }

    return {
        isLoading,
        data: data as T extends Asset ? AssetAmount<R> : string
    };
}

export function useAssetImage(assetIdentification: AssetIdentification): {
    isLoading: boolean;
    data: string | undefined;
} {
    const id = packAssetId(assetIdentification.blockchain, assetIdentification.address);
    const { data: jettons, isLoading } = useWalletJettonList();

    if (id === TON_ASSET.id) {
        return { isLoading: false, data: '/img/toncoin.svg' };
    }

    if (id === TRON_USDT_ASSET.id) {
        return { isLoading: false, data: '/img/usdt.webp' };
    }

    return {
        isLoading,
        data: jettons?.balances.find(i =>
            (assetIdentification.address as Address).equals(Address.parse(i.jettonAddress))
        )?.metadata?.image
    };
}

export function useAssetAmountFiatEquivalent(assetAmount: AssetAmount): {
    isLoading: boolean;
    data: BigNumber | undefined;
} {
    const { data: tokenRate, isLoading } = useRate(
        assetAmount.asset.id === TRON_USDT_ASSET.id
            ? 'USDT'
            : legacyTonAssetId(assetAmount.asset as TonAsset, { userFriendly: true })
    );

    return {
        isLoading,
        data:
            tokenRate?.prices !== undefined
                ? assetAmount.relativeAmount.multipliedBy(tokenRate.prices)
                : undefined
    };
}
