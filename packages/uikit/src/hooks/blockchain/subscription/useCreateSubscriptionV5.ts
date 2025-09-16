import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import {
    EncodedResultKinds,
    SubscriptionV5Encoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { TonWalletStandard, WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import {
    estimationSigner,
    externalMessage,
    getWalletSeqNo
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';

type SubscriptionEncodingParams = {
    selectedWallet: TonWalletStandard;
} & SubscriptionExtension;

// TODO Rename it after review
export const useCreateSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
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
            // contract,
            withdraw_msg_body,
            selectedWallet
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

        const encoder = new SubscriptionV5Encoder(selectedWallet);
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

        // TODO Ask Alexey weather v5r2 is hardcoded on his side
        // if (Address.parse(contract).toString() !== result.extensionAddress.toString()) {
        //     throw new Error('Contract extension addresses do not match!');
        // }

        if (selectedWallet.version >= WalletVersion.V5R1 && result.kind === EncodedResultKinds.V5) {
            const sender = new WalletMessageSender(api, selectedWallet, signer);
            await sender.send(result.actions);

            return true;
        }

        if (result.kind === EncodedResultKinds.V4) {
            const seqno = await getWalletSeqNo(api, selectedWallet.rawAddress);

            const unsigned = encoder.buildV4DeployAndLinkUnsignedBody({
                validUntil: SubscriptionV5Encoder.computeValidUntil(),
                seqno,
                sendAmount: result.sendAmount,
                extStateInit: result.extStateInit,
                deployBody: result.deployBody
            });

            const signature: Buffer = await signer(unsigned);

            const body = encoder.buildV4SignedBody(signature, unsigned);

            const walletContract = walletContractFromState(selectedWallet);
            const externalCell = externalMessage(walletContract, seqno, body);

            await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
                sendBlockchainMessageRequest: { boc: externalCell.toBoc().toString('base64') }
            });

            return true;
        }

        throw new Error('Unsupported wallet version flow');
    });
};

// TODO Rename it after review
export const useEstimateDeploySubscriptionV5 = () => {
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

        const encoder = new SubscriptionV5Encoder(selectedWallet);
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
            estimation = await rawTx.estimate(sender, result.tx);
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
