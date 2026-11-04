import { useMutation } from '@tanstack/react-query';
import { isTonAsset, Asset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import {
    Estimation,
    TonRecipientData,
    TronEstimation,
    TronRecipientData
} from '@tonkeeper/core/dist/entries/send';
import {
    toAnalyticsFeeAsset,
    useAnalyticsAssetId,
    useTrackTransactionSent
} from '../analytics/events-hooks';
import { useInvalidateActiveWalletQueries } from '../../state/wallet';

import { BATTERY_SENDER_CHOICE, EXTERNAL_SENDER_CHOICE, useGetSender } from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { useNotifyErrorHandle } from '../useNotification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import { TronSenderType, useGetTronSender } from './sender/useTronSender';
import { AllChainsSenderType } from './sender/sender-type';
import { TransferInitiatedBy } from '../analytics/events-hooks';
import { SendFrom, useAssetAmountSendContext, useSendAnalytics } from '../analytics/send';

export function useSendTransfer<T extends Asset>({
    recipient,
    amount,
    isMax,
    estimation,
    senderType,
    initiatedBy = 'user',
    from
}: {
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData;
    amount: AssetAmount<T>;
    isMax: boolean;
    estimation: Estimation<T>;
    senderType: AllChainsSenderType;
    /** How the user got to this send screen; defaults to an in-wallet flow. */
    initiatedBy?: TransferInitiatedBy;
    /** Where the send funnel was opened; without it no `send_*` events are reported. */
    from?: SendFrom;
}) {
    const sendAnalyticsContext = useAssetAmountSendContext(from, amount);
    const sendAnalytics = useSendAnalytics(sendAnalyticsContext);
    const trackTransactionSent = useTrackTransactionSent();
    const assetId = useAnalyticsAssetId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const transferService = useTonAssetTransferService();
    const getTronSender = useGetTronSender();

    return useMutation<boolean, Error>(async () => {
        sendAnalytics.confirm(toAnalyticsFeeAsset(senderType));
        try {
            if (isTonAsset(amount.asset)) {
                if (!('toAccount' in recipient)) {
                    throw new Error('Invalid recipient');
                }
                const comment = (recipient as TonRecipientData).comment;

                let senderChoice;
                if (senderType === 'external') {
                    senderChoice = EXTERNAL_SENDER_CHOICE;
                } else if (senderType === 'battery') {
                    senderChoice = BATTERY_SENDER_CHOICE;
                } else if (senderType === 'gasless') {
                    if (!isTonAsset(amount.asset)) {
                        throw new Error('Unexpected asset');
                    }

                    senderChoice = {
                        type: 'gasless',
                        asset: amount.asset
                    } as const;
                }

                if (!senderChoice) {
                    throw new Error('Unexpected sender choice');
                }

                await transferService.send(
                    await getSender(senderChoice),
                    estimation as Estimation<TonAsset>,
                    {
                        to: seeIfValidTonAddress(recipient.address.address)
                            ? recipient.address.address
                            : recipient.toAccount.address,
                        amount: amount as AssetAmount<TonAsset>,
                        isMax,
                        payload: comment ? { type: 'comment', value: comment } : undefined
                    }
                );
                sendAnalytics.succeed();
                trackTransactionSent({
                    category: 'transfer',
                    category_detail: isTon(amount.asset.address) ? 'coin' : 'token',
                    asset: assetId.fromAsset(amount.asset),
                    amount: amount.relativeAmount.toNumber(),
                    fee_asset: toAnalyticsFeeAsset(senderType),
                    is_max: isMax,
                    initiated_by: initiatedBy
                });
            } else if (amount.asset.id === TRON_USDT_ASSET.id) {
                const tronSender = await getTronSender(senderType as TronSenderType);
                await tronSender.send(
                    recipient.address.address,
                    amount as AssetAmount<TronAsset>,
                    estimation as TronEstimation
                );
                sendAnalytics.succeed();
                trackTransactionSent({
                    category: 'transfer',
                    category_detail: 'token',
                    asset: assetId.fromAsset(amount.asset),
                    amount: amount.relativeAmount.toNumber(),
                    fee_asset: toAnalyticsFeeAsset(senderType),
                    is_max: isMax,
                    initiated_by: initiatedBy
                });
            } else {
                throw new Error('Unexpected asset');
            }
        } catch (e) {
            sendAnalytics.fail(e);
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
