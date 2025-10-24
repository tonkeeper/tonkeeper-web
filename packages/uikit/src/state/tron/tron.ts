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
import { cachedSync } from '@tonkeeper/core/dist/utils/common';
import {
    Configuration as BatteryConfiguration,
    DefaultApi as BatteryApiClient
} from '@tonkeeper/core/dist/batteryApi';
import { useProAuthToken } from '../pro';

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

const cachedTronApi = cachedSync(
    Infinity,
    (baseURL: string, batteryApi: BatteryConfiguration) => new TronApi({ baseURL }, batteryApi)
);
export const useTronApi = () => {
    const config = useActiveConfig();
    const apiUrl = config.tron_api_url;
    const batteryApi = useBatteryApi();

    return cachedTronApi(apiUrl, batteryApi);
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

type Trc20FreeTransfersActiveConfig = {
    type: 'active';
    availableTransfersNumber: number;
    rechargeDate: Date;
};

type Trc20FreeTransfersInactiveConfig = {
    type: 'inactive';
};

export type Trc20FreeTransfersConfig =
    | Trc20FreeTransfersActiveConfig
    | Trc20FreeTransfersInactiveConfig;

export const useTrc20FreeTransfersConfig = () => {
    const batteryApi = useBatteryApi();
    const { data: proToken } = useProAuthToken();

    return useQuery<Trc20FreeTransfersConfig>(
        [QueryKey.trc20FreeTransfersConfig, proToken],
        async () => {
            if (!proToken) {
                return { type: 'inactive' as const };
            }

            try {
                const { availableTransfers, type, nextResetDate } = await new BatteryApiClient(
                    batteryApi
                ).getTronAvailableTransfers({
                    xProAuth: proToken
                });
                if (!nextResetDate) {
                    throw new Error('nextResetDate is undefined');
                }
                if (type !== 'active') {
                    throw new Error('type is inactive');
                }

                return {
                    type: type as 'active',
                    availableTransfersNumber: availableTransfers,
                    rechargeDate: new Date(nextResetDate * 1000)
                };
            } catch (e) {
                console.error(e);
                return { type: 'inactive' as const };
            }
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
    const { meanPrices: batteryMeanPricesCharges } = useBatteryServiceConfig();
    const tonMeanPriceTronUsdt = useMemo(
        () =>
            AssetAmount.fromRelativeAmount({
                asset: TON_ASSET,
                amount: batteryMeanPricesCharges.tonMeanPriceTronUsdt ?? 0
            }),
        [batteryMeanPricesCharges.tonMeanPriceTronUsdt]
    );
    const batteryUnitTonRate = useBatteryUnitTonRate();
    const { data: tonRate } = useRate(tonAssetAddressToString(TON_ASSET.address));

    const chargesPerTransfer = batteryMeanPricesCharges.batteryMeanPriceTronUsdt;
    const { fiatAmount: batteryFiatFee } = useFormatFiat(
        tonRate,
        !chargesPerTransfer ? undefined : batteryUnitTonRate.multipliedBy(chargesPerTransfer)
    );

    const { fiatAmount: tonFiatFee } = useFormatFiat(
        tonRate,
        tonMeanPriceTronUsdt.relativeAmount.isZero()
            ? undefined
            : tonMeanPriceTronUsdt.relativeAmount
    );

    const { data: trc20TrxDefaultFee } = useTrc20TrxDefaultFee();
    const { data: tronRate } = useRate(TRON_TRX_ASSET.address);
    const { fiatAmount: tronFiatFee } = useFormatFiat(
        tronRate,
        trc20TrxDefaultFee?.relativeAmount.isZero() ? undefined : trc20TrxDefaultFee?.relativeAmount
    );

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
    const { data: freeTrc20Config } = useTrc20FreeTransfersConfig();

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
        return tonSenderFee.ton.weiAmount.isZero()
            ? 0
            : Math.floor(tonBalance.weiAmount.div(tonSenderFee.ton.weiAmount).toNumber());
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

    const freeTrc20Transfers =
        freeTrc20Config?.type === 'active' ? freeTrc20Config.availableTransfersNumber : 0;

    return useMemo(() => {
        let total = undefined;
        if (
            batteryTransfers !== undefined ||
            tonTransfers !== undefined ||
            trxTransfers !== undefined
        ) {
            total =
                (batteryTransfers ?? 0) +
                (tonTransfers ?? 0) +
                (trxTransfers ?? 0) +
                freeTrc20Transfers;
        }

        return {
            batteryTransfers,
            tonTransfers,
            trxTransfers,
            total
        };
    }, [batteryTransfers, tonTransfers, trxTransfers, freeTrc20Transfers]);
};
