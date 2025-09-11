import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { SubscriptionV5Encoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';

type SubscriptionEncodingParams = {
    selectedWallet: TonWalletStandard;
} & SubscriptionExtension;

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

        if (!signer) throw new Error('Signer not found');

        const encoder = new SubscriptionV5Encoder(selectedWallet);
        const { actions, extensionAddress } = encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(admin),
            subscriptionId: subscription_id,
            firstChargingDate: first_charging_date,
            paymentPerPeriod: BigInt(payment_per_period),
            period: period,
            gracePeriod: grace_period,
            callerFee: BigInt(caller_fee),
            withdrawAddress: Address.parse(recipient),
            withdrawMsgBody: withdraw_msg_body
        });

        if (extensionAddress.toString() !== Address.parse(contract).toString()) {
            throw new Error('Contract extension addresses do not match!');
        }

        const sender = new WalletMessageSender(api, selectedWallet, signer as CellSigner);
        await sender.send(actions);

        return true;
    });
};

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

        const rawTx = new TonRawTransactionService(api, selectedWallet);
        const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

        const encoder = new SubscriptionV5Encoder(selectedWallet);
        const { actions, extensionAddress } = encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(admin),
            subscriptionId: subscription_id,
            firstChargingDate: first_charging_date,
            paymentPerPeriod: BigInt(payment_per_period),
            period: period,
            gracePeriod: grace_period,
            callerFee: BigInt(caller_fee),
            withdrawAddress: Address.parse(recipient),
            withdrawMsgBody: withdraw_msg_body
        });

        const estimation = await rawTx.estimate(sender, actions);

        return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
    });
};
