import { Address } from '@ton/core';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import { isBasicAsset, packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { TON_ASSET, TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TonAsset, legacyTonAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import BigNumber from 'bignumber.js';
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
                jettons.data?.balances.find(i => i.jetton.address === legacyTonAssetId(asset))
                    ?.balance || '0';
        }
        if (isBasicAsset(asset)) {
            data = new AssetAmount<TonAsset>({ asset, weiAmount: data });
        }
    } else {
        isLoading = tronBalances.isLoading;
        const token = tronBalances.data?.balances.find(i => i.token.address === asset.address);
        if (token && isBasicAsset(asset)) {
            data = new AssetAmount<TronAsset>({
                asset,
                weiAmount: token.weiAmount,
                image: token.token.image
            });
        } else {
            data = '0';
        }
    }

    return {
        isLoading,
        data: data as T extends Asset ? AssetAmount<R> : string
    };
}

export function useAssetImage({ blockchain, address }: AssetIdentification): string | undefined {
    const id = packAssetId(blockchain, address);
    const { data: jettons } = useWalletJettonList();
    const { data: balances } = useTronBalances();

    if (id === TON_ASSET.id) {
        return 'https://wallet.tonkeeper.com/img/toncoin.svg';
    }

    if (id === TRON_USDT_ASSET.id) {
        return 'https://wallet-dev.tonkeeper.com/img/usdt.svg';
    }

    if (typeof address === 'string') {
        return balances?.balances.find(i => i.token.address === address)?.token.image;
    } else {
        return jettons?.balances.find(i => address.equals(Address.parse(i.jetton.address)))?.jetton
            .image;
    }
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
