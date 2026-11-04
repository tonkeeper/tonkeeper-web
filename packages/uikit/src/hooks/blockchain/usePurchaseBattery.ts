import { useMutation, useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';

import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    useBatteryApi,
    useBatteryAuthToken,
    requireBatteryServiceConfig,
    useBatteryServiceConfig,
    useRequestBatteryAuthToken
} from '../../state/battery';
import {
    useActiveAccount,
    useActiveApi,
    useInvalidateActiveWalletQueries
} from '../../state/wallet';
import { useGetAccountSigner } from '../../state/mnemonic';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { BatteryTransportMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/battery-transport-message-sender';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useNotifyErrorHandle } from '../useNotification';
import { Address, beginCell } from '@ton/core';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    useGetEstimationSender,
    useGetSender
} from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { useToQueryKeyPart } from '../useToQueryKeyPart';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { useAnalyticsAssetId, useTrackTransactionSent } from '../analytics/events-hooks';

export function useEstimatePurchaseBattery({
    assetAmount,
    giftRecipient,
    promoCode
}: {
    assetAmount: AssetAmount<TonAsset>;
    giftRecipient?: string;
    promoCode?: string;
}) {
    const notifyError = useNotifyErrorHandle();
    const batteryConfig = useBatteryServiceConfig();
    const transferService = useTonAssetTransferService();

    const payWithTon = isTon(assetAmount.asset.address);

    const getSender = useGetEstimationSender(
        payWithTon ? EXTERNAL_SENDER_CHOICE : BATTERY_SENDER_CHOICE
    );
    const getSenderKey = useToQueryKeyPart(getSender);

    return useQuery<TonEstimation, Error>(
        [
            QueryKey.estimateBatteryPurchase,
            assetAmount,
            payWithTon,
            getSenderKey,
            transferService,
            giftRecipient,
            promoCode,
            batteryConfig
        ],
        async (): Promise<TonEstimation> => {
            try {
                const needPayload = giftRecipient || promoCode || !payWithTon;
                return await transferService.estimate(await getSender!(), {
                    to: requireBatteryServiceConfig(batteryConfig).fundReceiver,
                    amount: assetAmount,
                    payload: needPayload
                        ? {
                              type: 'raw',
                              value: encodePurchaseMessage({ giftRecipient, promoCode })
                          }
                        : undefined
                });
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always',
            enabled: !!getSender
        }
    );
}

export interface PurchaseBatteryParams {
    estimation: TonEstimation;
    assetAmount: AssetAmount<TonAsset>;
    giftRecipient?: string;
    promoCode?: string;
}

/**
 * The battery credits a TON recharge to whoever broadcasts it, so a multichain
 * wallet posts its self-paid recharge through the battery API (which carries
 * the wallet id headers). Resolves to `undefined` when the account has no
 * multichain wallet id or no battery token can be obtained, leaving the
 * caller on the plain TonAPI broadcast.
 */
const useGetMultichainTonRechargeSender = () => {
    const account = useActiveAccount();
    const api = useActiveApi();
    const batteryApi = useBatteryApi();
    const { data: authToken } = useBatteryAuthToken();
    const { mutateAsync: requestAuthToken } = useRequestBatteryAuthToken();
    const getSigner = useGetAccountSigner();

    return useCallback(async () => {
        if (!multichainApiWalletCredentials(account)) {
            return undefined;
        }
        const wallet = account.activeTonWallet;
        if (!isStandardTonWallet(wallet)) {
            return undefined;
        }

        let batteryToken = authToken;
        if (!batteryToken) {
            try {
                batteryToken = await requestAuthToken();
            } catch (e) {
                console.warn('Battery auth unavailable, recharging through TonAPI', e);
                return undefined;
            }
        }
        if (!batteryToken) {
            return undefined;
        }

        const signer = await getSigner(account.id);
        if (signer.type !== 'cell') {
            throw new Error("Can't send a transfer using this account");
        }

        return new BatteryTransportMessageSender(api, wallet, signer, {
            api: batteryApi,
            authToken: batteryToken
        });
    }, [account, api, batteryApi, authToken, requestAuthToken, getSigner]);
};

/**
 * Signs and broadcasts a battery top-up: a transfer of `assetAmount` to the
 * relayer's fund receiver, paid from the wallet's own TON when buying with
 * TON and relayed through the battery when buying with a jetton. Rejects on
 * failure; callers decide how to surface it.
 */
export const usePurchaseBatteryTransfer = () => {
    const getSender = useGetSender();
    const getMultichainTonRechargeSender = useGetMultichainTonRechargeSender();
    const account = useActiveAccount();
    const batteryConfig = useBatteryServiceConfig();
    const transferService = useTonAssetTransferService();
    const assetId = useAnalyticsAssetId();
    const trackTransactionSent = useTrackTransactionSent();

    return useCallback(
        async ({ estimation, assetAmount, giftRecipient, promoCode }: PurchaseBatteryParams) => {
            if (!isAccountTonWalletStandard(account) || account.type === 'ledger') {
                throw new Error("Can't send a transfer using this account");
            }

            const payWithTon = isTon(assetAmount.asset.address);

            const sender =
                (payWithTon ? await getMultichainTonRechargeSender() : undefined) ??
                (await getSender(payWithTon ? EXTERNAL_SENDER_CHOICE : BATTERY_SENDER_CHOICE));

            const needPayload = giftRecipient || promoCode || !payWithTon;
            await transferService.send(sender, estimation, {
                to: requireBatteryServiceConfig(batteryConfig).fundReceiver,
                amount: assetAmount,
                payload: needPayload
                    ? {
                          type: 'raw',
                          value: encodePurchaseMessage({ giftRecipient, promoCode })
                      }
                    : undefined
            });

            trackTransactionSent({
                category: 'transfer',
                category_detail: payWithTon ? 'coin' : 'token',
                asset: assetId.fromAsset(assetAmount.asset),
                amount: assetAmount.relativeAmount.toNumber(),
                fee_asset: payWithTon ? 'coin' : 'battery_charges'
            });
        },
        [
            account,
            getSender,
            getMultichainTonRechargeSender,
            batteryConfig,
            transferService,
            assetId,
            trackTransactionSent
        ]
    );
};

export const usePurchaseBattery = (params: PurchaseBatteryParams) => {
    const purchase = usePurchaseBatteryTransfer();
    const notifyError = useNotifyErrorHandle();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        try {
            await purchase(params);
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
};

const encodePurchaseMessage = ({
    giftRecipient,
    promoCode
}: {
    giftRecipient?: string;
    promoCode?: string;
}) => {
    const PURCHASE_OPCODE = 0xb7b2515f;
    let result = beginCell().storeUint(PURCHASE_OPCODE, 32);
    if (giftRecipient) {
        result = result.storeBit(1).storeAddress(Address.parse(giftRecipient));
    } else {
        result = result.storeBit(0);
    }

    return result.storeMaybeStringTail(promoCode).endCell();
};
