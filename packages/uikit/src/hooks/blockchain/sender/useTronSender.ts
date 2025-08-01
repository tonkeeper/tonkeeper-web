import { useTronApi } from '../../../state/tron/tron';
import { useActiveAccount, useActiveApi } from '../../../state/wallet';
import {
    useBatteryApi,
    useBatteryAuthToken,
    useRequestBatteryAuthToken
} from '../../../state/battery';
import { useAppSdk } from '../../appSdk';
import { isAccountTronCompatible } from '@tonkeeper/core/dist/entries/account';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { useCallback, useMemo } from 'react';
import { getOpenedSignerProvider, getTronSigner } from '../../../state/mnemonic';
import { TronBatterySender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-battery-sender';
import { TronTrxSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-trx-sender';
import { TronTonSender } from '@tonkeeper/core/dist/service/tron-blockchain/sender/tron-ton-sender';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useQuery } from '@tanstack/react-query';
import { useToQueryKeyPart } from '../../useToQueryKeyPart';
import { isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';

export type TronSenderChoice = { type: 'trx' } | { type: 'battery' } | { type: 'ton-asset' };
export const TRON_SENDER_CHOICE_TRX = { type: 'trx' as const };
export const TRON_SENDER_CHOICE_BATTERY = { type: 'battery' as const };
export const TRON_SENDER_CHOICE_TON_ASSET = { type: 'ton-asset' as const };
export type TronSenderType = TronSenderChoice['type'];

export const tronSenderChoiceByType = (type: TronSenderType | undefined) => {
    if (type === undefined) {
        return undefined;
    }
    switch (type) {
        case 'trx':
            return TRON_SENDER_CHOICE_TRX;
        case 'battery':
            return TRON_SENDER_CHOICE_BATTERY;
        case 'ton-asset':
            return TRON_SENDER_CHOICE_TON_ASSET;
        default:
            assertUnreachable(type);
    }
};

export const useAvailableTronSendersChoices = (receiver: string, assetAmount: AssetAmount) => {
    const batteryTronSender = useTronEstimationBatterySender();
    const tronTrxSender = useTronEstimationTrxSender();
    const tronTonSender = useTronEstimationTonSender();

    const queryKeyBattery = useToQueryKeyPart(batteryTronSender);
    const queryKeyTrx = useToQueryKeyPart(tronTrxSender);
    const queryKeyTon = useToQueryKeyPart(tronTonSender);

    return useQuery(
        [
            'tron-available-senders',
            queryKeyBattery,
            queryKeyTrx,
            queryKeyTon,
            receiver,
            assetAmount
        ],
        async () => {
            if (!isTronAsset(assetAmount.asset)) {
                return [];
            }
            const choices: TronSenderChoice[] = [];

            /**
             * battery is not authorized, but might be available
             */
            if (!batteryTronSender) {
                choices.push(TRON_SENDER_CHOICE_BATTERY);
            } else {
                try {
                    await batteryTronSender.estimate(
                        receiver,
                        assetAmount as AssetAmount<TronAsset>
                    );
                    choices.push(TRON_SENDER_CHOICE_BATTERY);
                } catch (e) {
                    console.debug(e);
                }
            }

            try {
                await tronTrxSender?.estimate(receiver, assetAmount as AssetAmount<TronAsset>);
                choices.push(TRON_SENDER_CHOICE_TRX);
            } catch (e) {
                console.debug(e);
            }

            try {
                await tronTonSender?.estimate(receiver, assetAmount as AssetAmount<TronAsset>);
                choices.push(TRON_SENDER_CHOICE_TON_ASSET);
            } catch (e) {
                console.debug(e);
            }

            return choices;
        }
    );
};

export const useGetTronSender = () => {
    const tronTonSender = useGetTronTonSender();
    const batteryTronSender = useGetBatteryTronSender();
    const tronTrxSender = useGetTronTrxSender();

    return useCallback(
        (choice: TronSenderChoice) => {
            switch (choice.type) {
                case 'trx':
                    return tronTrxSender();
                case 'battery':
                    return batteryTronSender();
                case 'ton-asset':
                    return tronTonSender();
                default:
                    assertUnreachable(choice);
            }
        },
        [tronTonSender, batteryTronSender, tronTrxSender]
    );
};

const useGetTronTonSender = () => {
    const tronApi = useTronApi();
    const tonApi = useActiveApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const { data: authToken } = useBatteryAuthToken();
    const { mutateAsync: requestToken } = useRequestBatteryAuthToken();
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
        const signer = getOpenedSignerProvider(sdk, tronApi, activeAccount);
        const batteryToken = authToken ?? (await requestToken());
        return new TronTonSender(
            tronApi,
            tonApi,
            batteryApi,
            activeTronWallet,
            activeTonWallet,
            signer,
            batteryToken
        );
    }, [
        activeAccount,
        activeTonWallet,
        activeTronWallet,
        authToken,
        requestToken,
        tonApi,
        tronApi,
        batteryApi
    ]);
};

const useGetBatteryTronSender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();
    const { data: authToken } = useBatteryAuthToken();
    const { mutateAsync: requestToken } = useRequestBatteryAuthToken();
    const sdk = useAppSdk();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useCallback(async () => {
        if (!activeTronWallet) {
            throw new Error('Tron is not enabled for the active wallet');
        }

        const signer = getTronSigner(sdk, tronApi, activeAccount);
        const batteryToken = authToken ?? (await requestToken());

        return new TronBatterySender(tronApi, batteryApi, activeTronWallet, signer, batteryToken);
    }, [requestToken, authToken, activeAccount, activeTronWallet, tronApi, batteryApi]);
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

export const useTronEstimationSender = (senderChoice: TronSenderChoice | undefined) => {
    const batteryTronSender = useTronEstimationBatterySender();
    const tronTrxSender = useTronEstimationTrxSender();
    const tronTonSender = useTronEstimationTonSender();
    switch (senderChoice?.type) {
        case undefined:
            return undefined;
        case 'trx':
            return tronTrxSender;
        case 'battery':
            return batteryTronSender;
        case 'ton-asset':
            return tronTonSender;
        default:
            assertUnreachable(senderChoice);
    }
};

const emptySigner = (): Promise<never> => {
    throw new Error('Unexpected call');
};

const useTronEstimationBatterySender = () => {
    const tronApi = useTronApi();
    const activeAccount = useActiveAccount();
    const batteryApi = useBatteryApi();

    const activeTronWallet = isAccountTronCompatible(activeAccount)
        ? activeAccount.activeTronWallet
        : undefined;

    return useMemo(
        () =>
            activeTronWallet
                ? new TronBatterySender(tronApi, batteryApi, activeTronWallet, emptySigner, '')
                : undefined,
        [activeAccount, activeTronWallet, tronApi, batteryApi]
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
            emptySigner,
            ''
        );
    }, [activeAccount, activeTronWallet, activeAccount.activeTonWallet, tronApi, batteryApi]);
};
