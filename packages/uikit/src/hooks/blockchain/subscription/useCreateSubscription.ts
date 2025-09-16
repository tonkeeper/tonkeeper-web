import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import {
    EncodedResultKinds,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { externalMessage, getWalletSeqNo } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { SubscriptionEncodingParams } from './commonTypes';

export const useCreateSubscription = () => {
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
            contract,
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

        if (!result.extensionAddress.equals(Address.parse(contract))) {
            throw new Error('Contract extension addresses do not match!');
        }

        if (result.kind === EncodedResultKinds.V5) {
            const sender = new WalletMessageSender(api, selectedWallet, signer);
            await sender.send(result.actions);

            return true;
        }

        if (result.kind === EncodedResultKinds.V4) {
            const seqno = await getWalletSeqNo(api, selectedWallet.rawAddress);

            const unsigned = encoder.buildV4DeployAndLinkUnsignedBody({
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
