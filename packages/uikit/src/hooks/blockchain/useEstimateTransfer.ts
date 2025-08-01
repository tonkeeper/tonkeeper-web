import { useQuery } from '@tanstack/react-query';
import { Asset, isTonAsset, isTronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Estimation, RecipientData, TonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { QueryKey } from '../../libs/queryKey';
import { DefaultRefetchInterval } from '../../state/tonendpoint';
import {
    BATTERY_SENDER_CHOICE,
    EXTERNAL_SENDER_CHOICE,
    TonSenderTypeUserAvailable,
    useGetEstimationSender
} from './useSender';
import { useTonAssetTransferService } from './useBlockchainService';
import { useNotifyErrorHandle } from '../useNotification';
import { seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useToQueryKeyPart } from '../useToQueryKeyPart';
import { useMemo } from 'react';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TronAsset } from '@tonkeeper/core/dist/entries/crypto/asset/tron-asset';
import {
    tronSenderChoiceByType,
    TronSenderType,
    useTronEstimationSender
} from './sender/useTronSender';
import { AllChainsSenderType } from './sender/sender-type';

export function useEstimateTransfer({
    recipient,
    amount,
    isMax,
    senderType
}: {
    recipient: RecipientData;
    amount: AssetAmount<Asset>;
    isMax: boolean;
    senderType: AllChainsSenderType | undefined;
}) {
    const tonSenderChoice = useMemo(() => {
        if (senderType === undefined || !isTonAsset(amount.asset)) {
            return undefined;
        }

        senderType = senderType as TonSenderTypeUserAvailable;

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

    const getSender = useGetEstimationSender(tonSenderChoice);
    const transferService = useTonAssetTransferService();
    const notifyError = useNotifyErrorHandle();
    const getSenderKey = useToQueryKeyPart(getSender);
    const tronSender = useTronEstimationSender(
        isTronAsset(amount.asset) ? tronSenderChoiceByType(senderType as TronSenderType) : undefined
    );

    return useQuery<Estimation, Error>(
        [
            QueryKey.estimate,
            recipient,
            amount,
            isMax,
            getSenderKey,
            tronSender,
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
                    return await tronSender!.estimate(
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
            enabled: !!getSender && senderType !== undefined,
            retry: 2
        }
    );
}
