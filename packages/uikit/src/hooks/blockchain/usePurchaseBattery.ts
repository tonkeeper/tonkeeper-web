import { useMutation, useQuery } from '@tanstack/react-query';
import { useAppContext } from '../appContext';
import { useGetActiveAccountSigner } from '../../state/mnemonic';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { TonAssetTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-asset-transaction.service';
import {
    BatteryMessageSender,
    WalletMessageSender,
    Sender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { TransferEstimation } from '@tonkeeper/core/dist/entries/send';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { useBatteryApi, useBatteryAuthToken } from '../../state/battery';
import {
    useActiveAccount,
    useActiveStandardTonWallet,
    useInvalidateActiveWalletQueries
} from '../../state/wallet';
import { QueryKey } from '../../libs/queryKey';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import { useNotifyErrorHandle } from '../useNotification';
import { Address, beginCell } from '@ton/core';

export function useEstimatePurchaseBattery({
    assetAmount,
    giftRecipient,
    promoCode
}: {
    assetAmount: AssetAmount<TonAsset>;
    giftRecipient?: string;
    promoCode?: string;
}) {
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    const batteryApi = useBatteryApi();
    const notifyError = useNotifyErrorHandle();
    const { data: authToken } = useBatteryAuthToken();

    return useQuery<TransferEstimation<TonAsset>, Error>(
        [QueryKey.estimateBatteryPurchase, assetAmount, batteryApi, wallet],
        async () => {
            try {
                if (!authToken) {
                    throw new Error('Auth token not found');
                }

                const batteryConfig = await batteryApi.default.getConfig();

                if ('error' in batteryConfig) {
                    throw new Error(batteryConfig.error);
                }

                const payWithTon = isTon(assetAmount.asset.address);

                const transferService = new TonAssetTransactionService(api, wallet);
                let sender: Sender;

                if (payWithTon) {
                    sender = new WalletMessageSender(api, wallet, estimationSigner);
                } else {
                    sender = new BatteryMessageSender(
                        {
                            jettonResponseAddress: batteryConfig.excess_account,
                            messageTtl: batteryConfig.message_ttl,
                            authToken
                        },
                        {
                            tonApi: api,
                            batteryApi
                        },
                        wallet,
                        estimationSigner
                    );
                }

                const needPayload = giftRecipient || promoCode || !payWithTon;
                return await transferService.estimate(sender, {
                    to: batteryConfig.fund_receiver,
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
            refetchOnMount: 'always'
        }
    );
}

export const usePurchaseBattery = ({
    estimation,
    assetAmount,
    giftRecipient,
    promoCode
}: {
    estimation: TransferEstimation<TonAsset>;
    assetAmount: AssetAmount<TonAsset>;
    giftRecipient?: string;
    promoCode?: string;
}) => {
    const getSigner = useGetActiveAccountSigner();
    const batteryApi = useBatteryApi();
    const account = useActiveAccount();
    const { api } = useAppContext();
    const notifyError = useNotifyErrorHandle();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const { data: authToken } = useBatteryAuthToken();

    return useMutation<boolean, Error>(async () => {
        const signer = await getSigner();
        if (signer === null) return false;
        try {
            if (!authToken) {
                throw new Error('Auth token not found');
            }

            if (!isAccountTonWalletStandard(account) || signer.type === 'ledger') {
                throw new Error("Can't send a transfer using this account");
            }

            const batteryConfig = await batteryApi.default.getConfig();

            if ('error' in batteryConfig) {
                throw new Error(batteryConfig.error);
            }

            const transferService = new TonAssetTransactionService(api, account.activeTonWallet);
            const payWithTon = isTon(assetAmount.asset.address);

            let sender: Sender;

            if (payWithTon) {
                sender = new WalletMessageSender(api, account.activeTonWallet, signer);
            } else {
                sender = new BatteryMessageSender(
                    {
                        jettonResponseAddress: batteryConfig.excess_account,
                        messageTtl: batteryConfig.message_ttl,
                        authToken
                    },
                    {
                        tonApi: api,
                        batteryApi
                    },
                    account.activeTonWallet,
                    signer
                );
            }

            const needPayload = giftRecipient || promoCode || !payWithTon;
            await transferService.send(sender, estimation, {
                to: batteryConfig.fund_receiver,
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
