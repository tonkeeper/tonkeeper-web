import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppContext } from '../../hooks/appContext';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval, FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import { useActiveAccount, useActiveTonWalletConfig, useAddTronToAccount } from '../wallet';
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
    const isTronEnabled = useIsTronEnabledGlobally();
    const tronWallet = useActiveTronWallet();
    const { data } = useActiveTonWalletConfig();

    return Boolean(
        isTronEnabled && tronWallet && data && !data.hiddenTokens.includes(TRON_USDT_ASSET.address)
    );
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
    const appContext = useAppContext();
    const apiKey = appContext.env?.tronApiKey;

    const apiUrl = appContext.mainnetConfig.tron_api_url;
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
