import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountWallets, useMetaEncryptionData } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import {
    EncodedResultKinds,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { SubscriptionEncodingParams } from './commonTypes';
import {
    ExtensionMessageSender,
    V4ActionTypes
} from '@tonkeeper/core/dist/service/ton-blockchain/sender/extension-message-sender';

export const useCreateSubscription = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const { data: metaEncryptionMap } = useMetaEncryptionData();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, SubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const {
            admin,
            subscription_id,
            first_charging_date,
            payment_per_period,
            period,
            grace_period,
            caller_fee,
            recipient,
            contract,
            withdraw_msg_body,
            selectedWallet,
            metadata
        } = subscriptionParams;

        const accountWallet = accountsWallets.find(
            accWallet => accWallet.wallet.id === selectedWallet.id
        );
        const accountId = accountWallet?.account?.id;

        if (!accountId) throw new Error('Account id is required!');

        const signer = await getSigner(sdk, accountId, {
            walletId: selectedWallet.id
        }).catch(() => null);

        if (!signer || signer.type !== 'cell') throw new Error('Signer is incorrect!');

        if (!metaEncryptionMap || !metaEncryptionMap[selectedWallet.rawAddress]) {
            throw new Error('walletMetaEncryptionPrivateKey is missed!');
        }
        const sender = new ExtensionMessageSender(api, selectedWallet, signer);

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
            walletMetaEncryptionPrivateKey:
                metaEncryptionMap[selectedWallet.rawAddress].encryptionPrivateKey
        });

        if (!result.extensionAddress.equals(Address.parse(contract))) {
            throw new Error('Contract extension addresses do not match!');
        }

        if (result.kind === EncodedResultKinds.V5) {
            await sender.send({
                kind: result.kind,
                outgoing: result.actions
            });

            return true;
        }

        if (result.kind === EncodedResultKinds.V4) {
            await sender.send({
                kind: EncodedResultKinds.V4,
                outgoing: {
                    actionType: V4ActionTypes.DEPLOY,
                    sendAmount: result.sendAmount,
                    extStateInit: result.extStateInit,
                    deployBody: result.deployBody
                }
            });

            return true;
        }

        throw new Error('Unsupported wallet version flow');
    });
};
