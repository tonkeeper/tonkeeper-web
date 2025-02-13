import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { AssetData } from '../components/home/Jettons';
import { useJettonList } from './jetton';
import { useActiveTonWalletConfig, useActiveWallet, useWalletAccountInfo } from './wallet';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    TON_ASSET,
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import {
    extraBalanceToTonAsset,
    jettonToTonAssetAmount,
    TonAsset
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { packAssetId } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { useTronBalances } from './tron/tron';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { Address } from '@ton/core';

export const useAssets = () => {
    const wallet = useActiveWallet();

    const { data: info, error, isFetching: isAccountLoading } = useWalletAccountInfo();
    const { data: jettons, error: jettonError, isFetching: isJettonLoading } = useJettonList();
    const { data: tronBalances } = useTronBalances();

    const assets = useMemo<AssetData | undefined>(() => {
        if (!info || !jettons || tronBalances === undefined) return undefined;

        return {
            ton: { info, jettons: jettons ?? { balances: [] } },
            tron: tronBalances
        };
    }, [info, jettons, wallet, tronBalances]);

    return [assets, error, isJettonLoading || isAccountLoading, jettonError] as const;
};

export const useAllChainsAssets = () => {
    const [assets, error, _, jettonError] = useAssets();
    const { data: config } = useActiveTonWalletConfig();

    return useMemo<{ assets: AssetAmount[] | undefined; error: Error | undefined }>(() => {
        if (!assets || !config) return { assets: undefined, error: undefined };

        const result: AssetAmount[] = [
            new AssetAmount({ asset: TON_ASSET, weiAmount: assets.ton.info.balance })
        ];

        if (assets.ton.info.extraBalance) {
            for (let extra of assets.ton.info.extraBalance) {
                const asset = new AssetAmount<TonAsset>({
                    weiAmount: new BigNumber(extra.amount),
                    asset: extraBalanceToTonAsset(extra)
                });
                result.push(asset);
            }
        }

        config.pinnedTokens.forEach(p => {
            if (p === TRON_USDT_ASSET.address && assets.tron) {
                result.push(assets.tron.usdt);
            } else {
                const jetton = assets.ton.jettons.balances.find(i => i.jetton.address === p);
                if (jetton) {
                    result.push(jettonToTonAssetAmount(jetton));
                }
            }
        });

        if (
            assets.tron &&
            !result.some(i => i.asset.id === TRON_USDT_ASSET.id) &&
            !config.hiddenTokens.includes(TRON_USDT_ASSET.address)
        ) {
            result.push(assets.tron.usdt);
        }

        assets.ton.jettons.balances
            .filter(b => !config.pinnedTokens.includes(b.jetton.address))
            .forEach(b => {
                result.push(jettonToTonAssetAmount(b));
            });

        return { assets: result, error: error ?? jettonError ?? undefined };
    }, [assets, error, jettonError, config]);
};

export const useAssetWeiBalance = (asset: AssetIdentification) => {
    const [assets] = useAssets();

    return useMemo(() => {
        if (!assets) {
            return undefined;
        }

        if (asset.blockchain === BLOCKCHAIN_NAME.TON) {
            if (asset.address === 'TON') {
                return new BigNumber(assets.ton.info.balance);
            }
            if (Address.isAddress(asset.address)) {
                const jAddress = asset.address.toRawString();
                return new BigNumber(
                    assets.ton.jettons.balances.find(i => i.jetton.address === jAddress)?.balance ||
                        '0'
                );
            } else {
                return new BigNumber(
                    assets.ton.info.extraBalance?.find(
                        item => item.preview.symbol === asset.address
                    )?.amount || '0'
                );
            }
        } else if (asset.blockchain === BLOCKCHAIN_NAME.TRON) {
            if (asset.address === TRON_USDT_ASSET.address) {
                return assets.tron?.usdt.weiAmount || new BigNumber(0);
            } else if (asset.address === TRON_TRX_ASSET.address) {
                return assets.tron?.trx.weiAmount || new BigNumber(0);
            } else {
                throw new Error('Unexpected asset');
            }
        } else {
            assertUnreachable(asset);
        }
    }, [assets, asset]);
};

export const useTonAssetsBalances = () => {
    const [assets] = useAssets();

    return useMemo(() => {
        if (!assets) {
            return undefined;
        }

        const tonAssetAmount = new AssetAmount({
            asset: TON_ASSET,
            weiAmount: assets.ton.info.balance,
            image: TON_ASSET.image
        });

        const jettonsAmounts = assets?.ton.jettons.balances.map(jettonToTonAssetAmount);

        return [tonAssetAmount, ...jettonsAmounts];
    }, [assets]);
};

export const useAsset = (assetId: string) => {
    const [assets] = useAssets();
    return useMemo(() => {
        if (!assets) {
            return undefined;
        }

        if (assetId === TON_ASSET.id) {
            return TON_ASSET;
        }

        const jetton = assets.ton.jettons.balances.find(
            i => packAssetId(BLOCKCHAIN_NAME.TON, i.jetton.address) === assetId
        );

        return jettonToTonAssetAmount(jetton!).asset;
    }, [assetId, assets]);
};
