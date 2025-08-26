import { useMutation, useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval, FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import {
    useActiveAccount,
    useActiveConfig,
    useActiveTonWalletConfig,
    useAddTronToAccount
} from '../wallet';
import { useEffect, useMemo } from 'react';
import { isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
import { TronWallet } from '@tonkeeper/core/dist/entries/tron/tron-wallet';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { useBatteryApi } from '../battery';
import { useGlobalPreferences, useMutateGlobalPreferences } from '../global-preferences';
import { useToggleHideJettonMutation } from '../jetton';

export const useIsTronEnabledForActiveWallet = () => {
    const tronWallet = useActiveTronWallet();
    const { data } = useActiveTonWalletConfig();

    return Boolean(tronWallet && data && !data.hiddenTokens.includes(TRON_USDT_ASSET.address));
};

export const useCanReceiveTron = () => {
    const isTronEnabledForWallet = useIsTronEnabledForActiveWallet();
    const isTronEnabledGlobally = useIsTronEnabledGlobally();
    const { data: balance } = useTronBalances();
    const tronWallet = useActiveTronWallet();

    if (!isTronEnabledGlobally) {
        return balance?.usdt?.weiAmount.gt(0) && isTronEnabledForWallet && tronWallet;
    }

    return isTronEnabledForWallet && tronWallet;
};

export const useToggleIsTronEnabledForActiveWallet = () => {
    const { mutateAsync: activateTron } = useAddTronToAccount();
    const tronWallet = useActiveTronWallet();

    const { data: config } = useActiveTonWalletConfig();
    const { mutateAsync: toggleHiddenJetton } = useToggleHideJettonMutation();

    return useMutation(() => {
        if (!tronWallet) {
            return activateTron();
        }

        if (!config) {
            return Promise.resolve();
        }

        return toggleHiddenJetton({ config, jettonAddress: TRON_USDT_ASSET.address });
    });
};

export const useAutoMarkTronFeatureAsSeen = () => {
    const { mutate } = useMutateGlobalPreferences();
    const globalPreferences = useGlobalPreferences();

    useEffect(() => {
        if (globalPreferences.highlightFeatures.tron) {
            mutate({ highlightFeatures: { ...globalPreferences.highlightFeatures, tron: false } });
        }
    }, [mutate, globalPreferences.highlightFeatures, globalPreferences.highlightFeatures.tron]);
};

export const useTronApi = () => {
    const config = useActiveConfig();
    const apiKey = config.tron_api_key;
    const apiUrl = config.tron_api_url;
    const batteryApi = useBatteryApi();

    return useMemo(() => new TronApi({ baseURL: apiUrl, apiKey }, batteryApi), [apiKey, apiUrl]);
};

export const useIsTronEnabledGlobally = () => {
    return useIsFeatureEnabled(FLAGGED_FEATURE.TRON);
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
