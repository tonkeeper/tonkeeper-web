import { useQuery } from '@tanstack/react-query';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Estimation, RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    SenderTypeUserAvailable,
    useGetEstimationSender,
    useGetTronEstimationSender
} from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { useNotifyErrorHandle } from '../useNotification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useToQueryKeyPart } from '../useToQueryKeyPart';
import { useMemo } from 'react';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';

export function useEstimateTransfer({
    recipient,
    amount,
    isMax,
    senderType
}: {
    recipient: RecipientData;
    amount: AssetAmount<Asset>;
    isMax: boolean;
    senderType: SenderTypeUserAvailable | undefined;
}) {
    const senderChoice = useMemo(() => {
        if (senderType === undefined) {
            return undefined;
        }

        if (senderType === 'external') {
            return EXTERNAL_SENDER_CHOICE;
        }

        if (senderType === 'battery') {
            return BATTERY_SENDER_CHOICE;
        }

        if (senderType === 'gasless') {
            if (!isTonAsset(amount.asset)) {
                throw new Error('Unexpected asset');
            }

            return {
                type: 'gasless',
                asset: amount.asset
            } as const;
        }

        assertUnreachable(senderType);
    }, [senderType, amount]);
    const getSender = useGetEstimationSender(senderChoice);
    const transferService = useTonAssetTransferService();
    const notifyError = useNotifyErrorHandle();
    const getSenderKey = useToQueryKeyPart(getSender);
    const getTronSender = useGetTronEstimationSender();
    const getTronEstimationSenderKey = useToQueryKeyPart(getTronSender);

    return useQuery<Estimation, Error>(
        [
            QueryKey.estimate,
            recipient,
            amount,
            isMax,
            getSenderKey,
            getTronEstimationSenderKey,
            transferService,
            notifyError
        ],
        async () => {
            const comment = (recipient as TonRecipientData).comment;
            try {
                if (isTonAsset(amount.asset)) {
                    if (!('toAccount' in recipient)) {
                        throw new Error('Invalid recipient');
                    }
                    return await transferService.estimate(await getSender!(), {
                        to: seeIfValidTonAddress(recipient.address.address)
                            ? recipient.address.address
                            : recipient.toAccount.address,
                        amount: amount as AssetAmount<TonAsset>,
                        isMax,
                        payload: comment ? { type: 'comment', value: comment } : undefined
                    });
                } else if (amount.asset.id === TRON_USDT_ASSET.id) {
                    const tronSender = getTronSender();
                    return await tronSender.estimate(
                        recipient.address.address,
                        amount as AssetAmount<TronAsset>
                    );
                } else {
                    throw new Error('Unexpected asset');
                }
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always',
            enabled: !!getSender && senderChoice !== undefined,
            retry: 2
        }
    );
}
