import { useMemo } from 'react';
import { AssetData } from '../components/home/Jettons';
import { useWalletContext } from '../hooks/appContext';
import { filterTonAssetList } from './jetton';
import { useTronBalances } from './tron/tron';
import { useWalletAccountInfo, useWalletJettonList } from './wallet';

export const useAssets = () => {
    const wallet = useWalletContext();

    const { data: info, error, isFetching: isAccountLoading } = useWalletAccountInfo();
    const { data: jettons, isFetching: isJettonLoading } = useWalletJettonList();
    const { data: tronBalances, isFetching: isTronLoading } = useTronBalances();

    const assets = useMemo<AssetData | undefined>(() => {
        if (!info || !jettons || !tronBalances) return undefined;
        return {
            ton: { info, jettons: filterTonAssetList(jettons, wallet) },
            tron: tronBalances
        };
    }, [info, jettons, wallet, tronBalances]);

    return [assets, error, isJettonLoading || isAccountLoading || isTronLoading] as const;
};
