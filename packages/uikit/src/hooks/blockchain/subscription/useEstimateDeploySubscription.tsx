import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import {
    EncodedResultKinds,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    estimationSigner,
    externalMessage,
    getWalletSeqNo
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { EmulationApi } from '@tonkeeper/core/dist/tonApiV2';

import { useActiveApi } from '../../../state/wallet';
import { SubscriptionEncodingParams } from './commonTypes';

export const useEstimateDeploySubscription = () => {
    const api = useActiveApi();

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
            selectedWallet
        } = subscriptionParams;

        const encoder = new SubscriptionEncoder(selectedWallet);
        const result = encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(admin),
            subscriptionId: subscription_id,
            firstChargingDate: first_charging_date,
            paymentPerPeriod: BigInt(payment_per_period),
            period,
            gracePeriod: grace_period,
            callerFee: BigInt(caller_fee),
            withdrawAddress: Address.parse(recipient),
            withdrawMsgBody: withdraw_msg_body
        });

        const rawTx = new TonRawTransactionService(api, selectedWallet);
        const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

        let estimation;
        if (result.kind === EncodedResultKinds.V5) {
            estimation = await rawTx.estimate(sender, result.actions);
        }

        if (result.kind === EncodedResultKinds.V4) {
            const seqno = await getWalletSeqNo(api, selectedWallet.rawAddress);

            const unsigned = encoder.buildV4DeployAndLinkUnsignedBody({
                seqno,
                sendAmount: result.sendAmount,
                extStateInit: result.extStateInit,
                deployBody: result.deployBody
            });

            const walletContract = walletContractFromState(selectedWallet);
            const externalCell = externalMessage(walletContract, seqno, unsigned);

            estimation = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
                emulateMessageToWalletRequest: { boc: externalCell.toBoc().toString('base64') }
            });
        }

        if (!estimation) {
            throw new Error('Unsupported wallet version flow!');
        }

        return {
            fee: estimation.fee as TransactionFeeTonAsset,
            address: result.extensionAddress
        };
    });
};
