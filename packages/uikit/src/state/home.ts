import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { AssetIdentification } from '@tonkeeper/core/dist/entries/crypto/asset/asset-identification';
import BigNumber from 'bignumber.js';
import { useMemo } from 'react';
import { AssetData } from '../components/home/Jettons';
import { useJettonList } from './jetton';
import { useActiveWallet, useWalletAccountInfo } from './wallet';

export const useAssets = () => {
    const wallet = useActiveWallet();

    const { data: info, error, isFetching: isAccountLoading } = useWalletAccountInfo();
    const { data: jettons, error: jettonError, isFetching: isJettonLoading } = useJettonList();

    const assets = useMemo<AssetData | undefined>(() => {
        if (!info || !jettons) return undefined;
        return {
            ton: { info, jettons: jettons ?? { balances: [] } },
            tron: { balances: [] }
        };
    }, [info, jettons, wallet]);

    return [assets, error, isJettonLoading || isAccountLoading, jettonError] as const;
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
            const jAddress = asset.address.toRawString();
            return new BigNumber(
                assets.ton.jettons.balances.find(i => i.jetton.address === jAddress)?.balance || '0'
            );
        }

        return new BigNumber(
            assets.tron.balances.find(i => i.token.address === asset.address)?.weiAmount || '0'
        );
    }, [assets, asset]);
};
