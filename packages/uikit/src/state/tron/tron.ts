import { useQuery } from '@tanstack/react-query';
import { useAppContext } from '../../hooks/appContext';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../tonendpoint';
import { useActiveAccount } from '../wallet';
import { useMemo } from 'react';
import { isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
import { TronWallet } from '@tonkeeper/core/dist/entries/tron/tron-wallet';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useDevSettings } from '../dev';

export const useTronApi = () => {
    const appContext = useAppContext();
    const apiKey = appContext.env?.tronApiKey;

    const apiUrl = appContext.mainnetConfig.tron_api_url || 'https://api.trongrid.io';

    return useMemo(() => new TronApi(apiUrl, apiKey), [apiKey, apiUrl]);
};

export const useIsTronEnabledGlobally = () => {
    const { data: devSettings } = useDevSettings();

    return devSettings?.tronEnabled;
};

export const useCanUseTronForActiveWallet = () => {
    const isTronEnabled = useIsTronEnabledGlobally();
    const account = useActiveAccount();

    if (!isTronEnabled) {
        return false;
    }

    return isAccountTronCompatible(account);
};

export const useActiveTronWallet = (): TronWallet | undefined => {
    const account = useActiveAccount();
    const isTronEnabled = useIsTronEnabledGlobally();

    if (!isTronEnabled) {
        return undefined;
    }

    if (isAccountTronCompatible(account)) {
        return account.activeTronWallet;
    }

    return undefined;
};

export type TronBalances = { trx: AssetAmount<TronAsset>; usdt: AssetAmount<TronAsset> } | null;

export const useTronBalances = () => {
    const tronApi = useTronApi();
    const activeWallet = useActiveTronWallet();

    return useQuery<TronBalances, Error>(
        [QueryKey.tronAssets, activeWallet?.address],
        async () => {
            if (!activeWallet) {
                return null;
            }
            const balances = await tronApi.getBalances(activeWallet?.address);

            const trx = new AssetAmount<TronAsset>({
                asset: TRON_TRX_ASSET,
                weiAmount: balances.trx
            });

            const usdt = new AssetAmount<TronAsset>({
                asset: TRON_USDT_ASSET,
                weiAmount: balances.usdt
            });

            return { trx, usdt };
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchIntervalInBackground: true,
            refetchOnWindowFocus: true,
            keepPreviousData: true
        }
    );
};
