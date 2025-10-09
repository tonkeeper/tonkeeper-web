import {
    Trc20FreeTransfersConfig,
    useTrc20FreeTransfersConfig,
    useTronApi
} from '../../../state/tron/tron';
import { useActiveAccount, useActiveApi } from '../../../state/wallet';
import {
    useBatteryApi,
    useBatteryAuthToken,
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
import { assertUnreachable, notNullish } from '@tonkeeper/core/dist/utils/types';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useQuery } from '@tanstack/react-query';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';
import { isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import {
    TransactionFeeBattery,
    TransactionFeeFreeTransfer,
    TransactionFeeTonAssetRelayed,
    TransactionFeeTronAsset
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { TronNotEnoughBalanceEstimationError } from '@tonkeeper/core/dist/errors/TronNotEnoughBalanceEstimationError';
import { pTimeout } from '@tonkeeper/core/dist/utils/common';
import { useProAuthToken } from '../../../state/pro';
import { TronFreeProSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-free-pro-sender';

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

const preEstimationTimeoutMS = 8000;

export const useAvailableTronSendersChoices = (receiver: string, assetAmount: AssetAmount) => {
    const batteryTronSender = useTronEstimationBatterySender();
    const tronTrxSender = useTronEstimationTrxSender();
    const tronTonSender = useTronEstimationTonSender();
    const { data: freeTrc20Config } = useTrc20FreeTransfersConfig();

    const queryKeyBattery = useToQueryKeyPart(batteryTronSender);
    const queryKeyTrx = useToQueryKeyPart(tronTrxSender);
    const queryKeyTon = useToQueryKeyPart(tronTonSender);

    return useQuery<TronSenderOption[]>(
        [
            'tron-available-senders',
            queryKeyBattery,
            queryKeyTrx,
            queryKeyTon,
            freeTrc20Config,
            receiver,
            assetAmount
        ],
        async () => {
            if (!isTronAsset(assetAmount.asset)) {
                return [];
            }
            const optionsGetters: (() => Promise<TronSenderOption | undefined>)[] = [];

            if (batteryTronSender) {
                optionsGetters.push(async () => {
                    try {
                        const { fee } = await pTimeout(
                            batteryTronSender.estimate(
                                receiver,
                                assetAmount as AssetAmount<TronAsset>
                            ),
                            preEstimationTimeoutMS
                        );
                        return {
                            type: TRON_SENDER_TYPE.BATTERY,
                            isEnoughBalance: true,
                            fee
                        };
                    } catch (e: unknown) {
                        if (e instanceof TronNotEnoughBalanceEstimationError && e.fee) {
                            return {
                                type: TRON_SENDER_TYPE.BATTERY,
                                isEnoughBalance: false,
                                fee: e.fee as TransactionFeeBattery
                            };
                        }
                        console.debug(e);
                    }
                });
            }

            if (tronTonSender) {
                optionsGetters.push(async () => {
                    try {
                        const { fee } = await pTimeout(
                            tronTonSender.estimate(receiver, assetAmount as AssetAmount<TronAsset>),
                            preEstimationTimeoutMS
                        );
                        return {
                            type: TRON_SENDER_TYPE.TON_ASSET,
                            isEnoughBalance: true,
                            fee
                        };
                    } catch (e) {
                        if (e instanceof TronNotEnoughBalanceEstimationError && e.fee) {
                            return {
                                type: TRON_SENDER_TYPE.TON_ASSET,
                                isEnoughBalance: false,
                                fee: e.fee as TransactionFeeTonAssetRelayed
                            };
                        }
                        console.debug(e);
                    }
                });
            }

            if (tronTrxSender) {
                optionsGetters.push(async () => {
                    try {
                        const { fee } = await pTimeout(
                            tronTrxSender.estimate(receiver, assetAmount as AssetAmount<TronAsset>),
                            preEstimationTimeoutMS
                        );
                        return { type: TRON_SENDER_TYPE.TRX, isEnoughBalance: true, fee };
                    } catch (e) {
                        if (e instanceof TronNotEnoughBalanceEstimationError && e.fee) {
                            return {
                                type: TRON_SENDER_TYPE.TRX,
                                isEnoughBalance: false,
                                fee: e.fee as TransactionFeeTronAsset
                            };
                        }
                        console.debug(e);
                    }
                });
            }

            if (freeTrc20Config) {
                optionsGetters.push(async () => ({
                    type: TRON_SENDER_TYPE.FREE_PRO,
                    isEnoughBalance:
                        freeTrc20Config.type === 'active' &&
                        freeTrc20Config.availableTransfersNumber > 0,
                    config: freeTrc20Config,
                    fee: { type: 'free-transfer' }
                }));
            }

            const options = (await Promise.all(optionsGetters.map(o => o()))).filter(notNullish);

            return options
                .filter(o => o.isEnoughBalance)
                .concat(options.filter(o => !o.isEnoughBalance));
        },
        {
            enabled: !!tronTrxSender || !!tronTonSender
        }
    );
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

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useCallback(async () => {
        const proToken = await sdk.subscriptionService.getToken();
        if (!activeTronWallet || !proToken) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        const signer = getTronSigner(sdk, tronApi, activeAccount);
        return new TronFreeProSender(tronApi, batteryApi, activeTronWallet, signer, proToken);
    }, [activeAccount, activeTronWallet, tronApi, batteryApi]);
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
    const { data: proToken } = useProAuthToken();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(() => {
        if (!activeTronWallet || !isStandardTonWallet(activeAccount.activeTonWallet) || !proToken) {
            return undefined;
        }

        return new TronFreeProSender(tronApi, batteryApi, activeTronWallet, emptySigner, proToken);
    }, [
        activeAccount,
        activeTronWallet,
        activeAccount.activeTonWallet,
        tronApi,
        batteryApi,
        proToken
    ]);
};
