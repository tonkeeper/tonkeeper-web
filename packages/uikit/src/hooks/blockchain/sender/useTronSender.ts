import {
    Trc20FreeTransfersConfig,
    useTrc20FreeTransfersConfig,
    useTrc20TransferDefaultFees,
    useTronApi,
    useTronBalances
} from '../../../state/tron/tron';
import { useActiveAccount, useActiveApi, useTonBalance } from '../../../state/wallet';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useBatteryBalance,
    useBatteryUnitTonRate,
    useRequestBatteryAuthToken
} from '../../../state/battery';
import { useAppSdk } from '../../appSdk';
import { isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { useCallback, useMemo } from 'react';
import { getMultiPayloadSigner, getTronSigner } from '../../../state/mnemonic';
import { TronBatterySender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-battery-sender';
import { TronTrxSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-trx-sender';
import { TronTonSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-ton-sender';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import {
    TransactionFeeBattery,
    TransactionFeeFreeTransfer,
    TransactionFeeTonAssetRelayed,
    TransactionFeeTronAsset
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { useProAuthToken } from '../../../state/pro';
import { TronFreeProSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-free-pro-sender';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../../state/tonendpoint';
import { useIsFullWidthMode } from '../../useIsFullWidthMode';

export enum TRON_SENDER_TYPE {
    TRX = 'tron-trx',
    BATTERY = 'tron-battery',
    TON_ASSET = 'tron-ton-asset',
    FREE_PRO = 'free-pro'
}

export type TronSenderType = (typeof TRON_SENDER_TYPE)[keyof typeof TRON_SENDER_TYPE];

export type TronSenderOption =
    | { type: TRON_SENDER_TYPE.TRX; isEnoughBalance: boolean; fee: TransactionFeeTronAsset }
    | {
          type: TRON_SENDER_TYPE.BATTERY;
          isEnoughBalance: boolean;
          fee: TransactionFeeBattery;
      }
    | {
          type: TRON_SENDER_TYPE.TON_ASSET;
          isEnoughBalance: boolean;
          fee: TransactionFeeTonAssetRelayed;
      }
    | {
          type: TRON_SENDER_TYPE.FREE_PRO;
          isEnoughBalance: boolean;
          config: Trc20FreeTransfersConfig;
          fee: TransactionFeeFreeTransfer;
      };

export const useAvailableTronSendersChoices = (
    _receiver: string,
    assetAmount: AssetAmount
): { data: TronSenderOption[] | undefined } => {
    const { batterySenderFee, tonSenderFee, trxSenderFee } = useTrc20TransferDefaultFees();
    const { data: freeTrc20Config } = useTrc20FreeTransfersConfig();
    const { data: batteryBalance } = useBatteryBalance();
    const { data: tonBalance } = useTonBalance();
    const { data: tronBalances } = useTronBalances();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const activeAccount = useActiveAccount();
    const isTronEnabled = useIsFeatureEnabled(FLAGGED_FEATURE.TRON);
    // Pro features modal isn't designed for compact layouts (extension, web mobile, twa),
    // so the FreePro sender option is hidden there.
    const isFreeProSenderAvailable = useIsFullWidthMode();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;
    const activeTonWallet = isStandardTonWallet(activeAccount.activeTonWallet)
        ? activeAccount.activeTonWallet
        : undefined;

    const isReady = trxSenderFee.trx !== undefined || freeTrc20Config !== undefined;

    const data = useMemo(() => {
        if (!isTronAsset(assetAmount.asset)) {
            return [];
        }

        const options: TronSenderOption[] = [];

        // FreePro
        if (freeTrc20Config && isTronEnabled && isFreeProSenderAvailable) {
            options.push({
                type: TRON_SENDER_TYPE.FREE_PRO,
                isEnoughBalance:
                    freeTrc20Config.type === 'active' &&
                    freeTrc20Config.availableTransfersNumber > 0,
                config: freeTrc20Config,
                fee: { type: 'free-transfer' }
            });
        }

        // Battery
        if (batteryAuthToken && isTronEnabled && batterySenderFee.charges != null) {
            options.push({
                type: TRON_SENDER_TYPE.BATTERY,
                isEnoughBalance: batteryBalance
                    ? batteryBalance.batteryUnitsBalance.gte(batterySenderFee.charges)
                    : false,
                fee: { type: 'battery', charges: batterySenderFee.charges }
            });
        }

        // TON Asset
        if (activeTonWallet && isTronEnabled && !tonSenderFee.ton.weiAmount.isZero()) {
            options.push({
                type: TRON_SENDER_TYPE.TON_ASSET,
                isEnoughBalance: tonBalance
                    ? tonBalance.weiAmount.gte(tonSenderFee.ton.weiAmount)
                    : false,
                fee: {
                    type: 'ton-asset-relayed',
                    extra: tonSenderFee.ton,
                    sendToAddress: '' // Placeholder; real address comes from estimation in useEstimateTransfer
                }
            });
        }

        // TRX
        if (activeTronWallet && trxSenderFee.trx) {
            options.push({
                type: TRON_SENDER_TYPE.TRX,
                isEnoughBalance:
                    tronBalances?.trx != null && !trxSenderFee.trx.weiAmount.isZero()
                        ? tronBalances.trx.weiAmount.gte(trxSenderFee.trx.weiAmount)
                        : false,
                fee: { type: 'tron-asset', extra: trxSenderFee.trx }
            });
        }

        return options;
    }, [
        assetAmount.asset,
        freeTrc20Config,
        isTronEnabled,
        isFreeProSenderAvailable,
        batteryAuthToken,
        batterySenderFee.charges,
        batteryBalance,
        activeTonWallet,
        tonBalance,
        tonSenderFee.ton,
        activeTronWallet,
        trxSenderFee.trx,
        tronBalances
    ]);

    return { data: isReady ? data : undefined };
};

export const useGetTronSender = () => {
    const tronTonSender = useGetTronTonSender();
    const batteryTronSender = useGetBatteryTronSender();
    const tronTrxSender = useGetTronTrxSender();
    const tronFreeProSender = useGetTronFreeProSender();

    return useCallback(
        (type: TronSenderType) => {
            switch (type) {
                case TRON_SENDER_TYPE.TRX:
                    return tronTrxSender();
                case TRON_SENDER_TYPE.BATTERY:
                    return batteryTronSender();
                case TRON_SENDER_TYPE.TON_ASSET:
                    return tronTonSender();
                case TRON_SENDER_TYPE.FREE_PRO:
                    return tronFreeProSender();
                default:
                    assertUnreachable(type);
            }
        },
        [tronTonSender, batteryTronSender, tronTrxSender, tronFreeProSender]
    );
};

const useGetTronTonSender = () => {
    const tronApi = useTronApi();
    const tonApi = useActiveApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const sdk = useAppSdk();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;
    const activeTonWallet = isStandardTonWallet(activeAccount.activeTonWallet)
        ? activeAccount.activeTonWallet
        : undefined;

    return useCallback(async () => {
        if (!activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        if (!activeTonWallet) {
            throw new Error('Ton wallet does not support trc20 fee covering');
        }
        const signer = getMultiPayloadSigner(sdk, tronApi, activeAccount);
        return new TronTonSender(
            tronApi,
            tonApi,
            batteryApi,
            activeTronWallet,
            activeTonWallet,
            signer
        );
    }, [activeAccount, activeTonWallet, activeTronWallet, tonApi, tronApi, batteryApi]);
};

const useGetBatteryTronSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const { data: authToken } = useBatteryAuthToken();
    const { mutateAsync: requestToken } = useRequestBatteryAuthToken();
    const sdk = useAppSdk();
    const batteryUnitTonRate = useBatteryUnitTonRate();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useCallback(async () => {
        if (!activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        const signer = getTronSigner(sdk, tronApi, activeAccount);
        const batteryToken = authToken ?? (await requestToken());

        return new TronBatterySender(
            tronApi,
            batteryApi,
            activeTronWallet,
            signer,
            batteryUnitTonRate,
            batteryToken
        );
    }, [
        requestToken,
        authToken,
        activeAccount,
        activeTronWallet,
        tronApi,
        batteryApi,
        batteryUnitTonRate
    ]);
};

const useGetTronTrxSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const sdk = useAppSdk();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useCallback(async () => {
        if (!activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        const signer = getTronSigner(sdk, tronApi, activeAccount);
        return new TronTrxSender(tronApi, activeTronWallet, signer);
    }, [activeAccount, activeTronWallet, tronApi]);
};

const useGetTronFreeProSender = () => {
    const batteryApi = useBatteryApi();
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const sdk = useAppSdk();
    const { data: batteryAuthToken } = useBatteryAuthToken();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useCallback(async () => {
        const proToken = await sdk.subscriptionService.getToken();

        if (!proToken) {
            throw new Error('Pro subscription is missing');
        }

        if (!activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        if (!batteryAuthToken) {
            throw new Error('Battery service authorization is missing');
        }

        const signer = getTronSigner(sdk, tronApi, activeAccount);
        return new TronFreeProSender(
            tronApi,
            batteryApi,
            activeTronWallet,
            signer,
            batteryAuthToken,
            proToken
        );
    }, [activeAccount, activeTronWallet, tronApi, batteryApi, batteryAuthToken]);
};

export const useTronEstimationSender = (senderType: TronSenderType | undefined) => {
    const batteryTronSender = useTronEstimationBatterySender();
    const tronTrxSender = useTronEstimationTrxSender();
    const tronTonSender = useTronEstimationTonSender();
    const tronFreeProSender = useTronEstimationFreeProSender();
    switch (senderType) {
        case undefined:
            return undefined;
        case TRON_SENDER_TYPE.TRX:
            return tronTrxSender;
        case TRON_SENDER_TYPE.BATTERY:
            return batteryTronSender;
        case TRON_SENDER_TYPE.TON_ASSET:
            return tronTonSender;
        case TRON_SENDER_TYPE.FREE_PRO:
            return tronFreeProSender;

        default:
            assertUnreachable(senderType);
    }
};

const emptySigner = (): Promise<never> => {
    throw new Error('Unexpected call');
};

const useTronEstimationBatterySender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const { data: authToken } = useBatteryAuthToken();
    const batteryUnitTonRate = useBatteryUnitTonRate();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(
        () =>
            activeTronWallet && authToken
                ? new TronBatterySender(
                      tronApi,
                      batteryApi,
                      activeTronWallet,
                      emptySigner,
                      batteryUnitTonRate,
                      authToken
                  )
                : undefined,
        [activeAccount, activeTronWallet, tronApi, batteryApi, authToken, batteryUnitTonRate]
    );
};

const useTronEstimationTrxSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(
        () =>
            activeTronWallet
                ? new TronTrxSender(tronApi, activeTronWallet, emptySigner)
                : undefined,
        [activeAccount, activeTronWallet, tronApi, batteryApi]
    );
};

const useTronEstimationTonSender = () => {
    const tronApi = useTronApi();
    const tonApi = useActiveApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(() => {
        if (!activeTronWallet || !isStandardTonWallet(activeAccount.activeTonWallet)) {
            return undefined;
        }

        return new TronTonSender(
            tronApi,
            tonApi,
            batteryApi,
            activeTronWallet,
            activeAccount.activeTonWallet,
            emptySigner
        );
    }, [activeAccount, activeTronWallet, activeAccount.activeTonWallet, tronApi, batteryApi]);
};

const useTronEstimationFreeProSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const { data: batteryAuthToken } = useBatteryAuthToken();
    const { data: proToken } = useProAuthToken();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(() => {
        if (
            !activeTronWallet ||
            !isStandardTonWallet(activeAccount.activeTonWallet) ||
            !proToken ||
            !batteryAuthToken
        ) {
            return undefined;
        }

        return new TronFreeProSender(
            tronApi,
            batteryApi,
            activeTronWallet,
            emptySigner,
            batteryAuthToken,
            proToken
        );
    }, [
        activeAccount,
        activeTronWallet,
        activeAccount.activeTonWallet,
        tronApi,
        batteryApi,
        proToken,
        batteryAuthToken
    ]);
};
