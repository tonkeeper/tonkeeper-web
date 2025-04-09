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
import { useAnalyticsTrack } from '../amplitude';
import { useInvalidateActiveWalletQueries } from '../../state/wallet';

import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderTypeUserAvailable,
    useGetSender,
    useGetTronSender
} from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { useNotifyErrorHandle } from '../useNotification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';

export function useSendTransfer<T extends Asset>({
    recipient,
    amount,
    isMax,
    estimation,
    senderType
}: {
    recipient: T extends TonAsset ? TonRecipientData : TronRecipientData;
    amount: AssetAmount<T>;
    isMax: boolean;
    estimation: Estimation<T>;
    senderType: SenderTypeUserAvailable;
}) {
    const track = useAnalyticsTrack();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const transferService = useTonAssetTransferService();
    const getTronSender = useGetTronSender();

    return useMutation<boolean, Error>(async () => {
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
                track('send_success', {
                    from: 'send_confirm',
                    token: isTon(amount.asset.address) ? 'ton' : amount.asset.symbol
                });
            } else if (amount.asset.id === TRON_USDT_ASSET.id) {
                const tronSender = await getTronSender();
                await tronSender.send(
                    recipient.address.address,
                    amount as AssetAmount<TronAsset>,
                    (estimation as TronEstimation).resources
                );
            } else {
                throw new Error('Unexpected asset');
            }
        } catch (e) {
            await notifyError(e);
        }

        await invalidateAccountQueries();
        return true;
    });
}
