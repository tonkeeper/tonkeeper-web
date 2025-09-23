import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import {
    EncodedResultKinds,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

import { SubscriptionEncodingParams } from './commonTypes';
import { useActiveApi, useMetaEncryptionData } from '../../../state/wallet';
import {
    ExtensionMessageSender,
    V4ActionTypes
} from '@tonkeeper/core/dist/service/ton-blockchain/sender/extension-message-sender';

export const useEstimateDeploySubscription = () => {
    const api = useActiveApi();
    const { data: metaEncryptionMap } = useMetaEncryptionData();

    return useMutation<
        { fee: TransactionFeeTonAsset; address: Address },
        Error,
        SubscriptionEncodingParams
    >(async subscriptionParams => {
        const {
            admin,
            subscription_id,
            first_charging_date,
            payment_per_period,
            period,
            grace_period,
            caller_fee,
            recipient,
            withdraw_msg_body,
            selectedWallet,
            metadata
        } = subscriptionParams;

        if (!metaEncryptionMap || !metaEncryptionMap[selectedWallet.rawAddress]) {
            throw new Error('walletMetaKeyPair is missed!');
        }

        const encoder = new SubscriptionEncoder(selectedWallet);
        const result = await encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(admin),
            subscriptionId: subscription_id,
            firstChargingDate: first_charging_date,
            paymentPerPeriod: BigInt(payment_per_period),
            period,
            gracePeriod: grace_period,
            callerFee: BigInt(caller_fee),
            withdrawAddress: Address.parse(recipient),
            withdrawMsgBody: withdraw_msg_body,
            metadata,
            walletMetaKeyPair: metaEncryptionMap[selectedWallet.rawAddress].keyPair
        });

        const sender = new ExtensionMessageSender(api, selectedWallet, estimationSigner);

        let estimation;
        if (result.kind === EncodedResultKinds.V5) {
            estimation = await sender.estimate({
                kind: result.kind,
                outgoing: result.actions
            });
        }

        if (result.kind === EncodedResultKinds.V4) {
            estimation = await sender.estimate({
                kind: EncodedResultKinds.V4,
                outgoing: {
                    actionType: V4ActionTypes.DEPLOY,
                    sendAmount: result.sendAmount,
                    extStateInit: result.extStateInit,
                    deployBody: result.deployBody
                }
            });
        }

        if (!estimation || estimation.fee?.type !== 'ton-asset') {
            throw new Error('Unsupported wallet version flow!');
        }

        return {
            fee: estimation.fee,
            address: result.extensionAddress
        };
    });
};
