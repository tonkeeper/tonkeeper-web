import { useMutation, useQuery } from '@tanstack/react-query';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval, FLAGGED_FEATURE, useIsFeatureEnabled } from '../tonendpoint';
import {
    useActiveAccount,
    useActiveConfig,
    useActiveTonWalletConfig,
    useAddTronToAccount,
    useTonBalance
} from '../wallet';
import { useEffect, useMemo } from 'react';
import { isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
import { TronWallet } from '@tonkeeper/core/dist/entries/tron/tron-wallet';
import { TronApi } from '@tonkeeper/core/dist/tronApi';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    TON_ASSET,
    TRON_TRX_ASSET,
    TRON_USDT_ASSET
} from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import {
    useBatteryApi,
    useBatteryBalance,
    useBatteryServiceConfig,
    useBatteryUnitTonRate
} from '../battery';
import { useGlobalPreferences, useMutateGlobalPreferences } from '../global-preferences';
import { useToggleHideJettonMutation } from '../jetton';
import { useFormatFiat, useRate } from '../rates';
import { tonAssetAddressToString } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { TronTrxSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-trx-sender';
import { TronTrc20Encoder } from '@tonkeeper/core/dist/service/tron-blockchain/encoder/tron-trc20-encoder';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

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

const useTrc20TrxDefaultFee = () => {
    const tronApi = useTronApi();

    return useQuery([QueryKey.trc20TrxDefaultFee], () =>
        TronTrxSender.getBurnTrxAmountForResources(
            tronApi,
            TronTrc20Encoder.transferDefaultResources
        )
    );
};

export const useTrc20TransferDefaultFees = () => {
    const tonMeanPriceTronUsdt = 440000000; // TODO: get this from config
    const { meanPrices: batteryMeanPricesCharges } = useBatteryServiceConfig();
    const batteryUnitTonRate = useBatteryUnitTonRate();
    const { data: tonRate } = useRate(tonAssetAddressToString(TON_ASSET.address));

    const chargesPerTransfer = useMemo(
        () => batteryUnitTonRate.multipliedBy(batteryMeanPricesCharges.batteryMeanPriceTronUsdt!),
        [batteryUnitTonRate, batteryMeanPricesCharges.batteryMeanPriceTronUsdt]
    );
    const { fiatAmount: batteryFiatFee } = useFormatFiat(tonRate, chargesPerTransfer);
    const { fiatAmount: tonFiatFee } = useFormatFiat(
        tonRate,
        shiftedDecimals(tonMeanPriceTronUsdt, TON_ASSET.decimals)
    );

    const { data: trc20TrxDefaultFee } = useTrc20TrxDefaultFee();
    const { data: tronRate } = useRate(TRON_TRX_ASSET.address);
    const { fiatAmount: tronFiatFee } = useFormatFiat(tronRate, trc20TrxDefaultFee?.relativeAmount);

    return useMemo(() => {
        return {
            batterySenderFee: {
                charges: chargesPerTransfer,
                fiatAmount: batteryFiatFee
            },
            tonSenderFee: {
                ton: tonMeanPriceTronUsdt,
                fiatAmount: tonFiatFee
            },
            trxSenderFee: {
                trx: trc20TrxDefaultFee,
                fiatAmount: tronFiatFee
            }
        };
    }, [
        chargesPerTransfer,
        batteryFiatFee,
        tonMeanPriceTronUsdt,
        tonFiatFee,
        trc20TrxDefaultFee,
        tronFiatFee
    ]);
};

export const useTrc20TransfersNumberAvailable = () => {
    const { batterySenderFee, tonSenderFee, trxSenderFee } = useTrc20TransferDefaultFees();
    const { data: tronBalances } = useTronBalances();
    const { data: batteryBalance } = useBatteryBalance();
    const { data: tonBalance } = useTonBalance();

    const batteryTransfers = useMemo(() => {
        if (!batteryBalance || !batterySenderFee.charges) {
            return undefined;
        }
        return Math.floor(
            batteryBalance.batteryUnitsBalance.div(batterySenderFee.charges).toNumber()
        );
    }, [batteryBalance, batterySenderFee.charges]);

    const tonTransfers = useMemo(() => {
        if (tonBalance === undefined || !tonSenderFee.ton) {
            return undefined;
        }
        return Math.floor(tonBalance.weiAmount.div(tonSenderFee.ton).toNumber());
    }, [tonBalance, tonSenderFee.ton]);

    const trxTransfers = useMemo(() => {
        if (
            tronBalances?.trx === undefined ||
            !trxSenderFee.trx ||
            trxSenderFee.trx.weiAmount.isZero()
        ) {
            return undefined;
        }
        return Math.floor(tronBalances.trx.weiAmount.div(trxSenderFee.trx.weiAmount).toNumber());
    }, [tronBalances?.trx, trxSenderFee.trx]);

    return useMemo(() => {
        let total = undefined;
        if (
            batteryTransfers !== undefined ||
            tonTransfers !== undefined ||
            trxTransfers !== undefined
        ) {
            total = (batteryTransfers ?? 0) + (tonTransfers ?? 0) + (trxTransfers ?? 0);
        }

        return {
            batteryTransfers,
            tonTransfers,
            trxTransfers,
            total
        };
    }, [batteryTransfers, tonTransfers, trxTransfers]);
};
