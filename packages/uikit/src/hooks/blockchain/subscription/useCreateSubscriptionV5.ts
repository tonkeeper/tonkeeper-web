import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { SubscriptionV5Encoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { SubscriptionExtension } from '@tonkeeper/core/dist/pro';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { useTonRawTransactionService } from '../useBlockchainService';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';

type SubscriptionEncodingParams = {
    fromWallet: WalletId;
} & SubscriptionExtension;

export const useCreateSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, SubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const accountAndWallet = accountsWallets.find(
            w => w.wallet.id === subscriptionParams.fromWallet
        );

        if (!accountAndWallet) throw new Error('AccountAndWallet not found');

        const signer = await getSigner(sdk, accountAndWallet.account.id, {
            walletId: accountAndWallet.wallet.id
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const encoder = new SubscriptionV5Encoder(accountAndWallet.wallet);
        const { actions, extensionAddress } = encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(subscriptionParams.admin),
            subscriptionId: subscriptionParams.subscription_id,
            firstChargingDate: subscriptionParams.first_charging_date,
            paymentPerPeriod: BigInt(subscriptionParams.payment_per_period),
            period: subscriptionParams.period,
            gracePeriod: subscriptionParams.grace_period,
            callerFee: BigInt(subscriptionParams.caller_fee),
            withdrawAddress: Address.parse(subscriptionParams.recipient),
            withdrawMsgBody: subscriptionParams.withdraw_msg_body
        });

        if (extensionAddress.toString() !== Address.parse(subscriptionParams.contract).toString()) {
            throw new Error('Contract extension addresses do not match!');
        }

        const sender = new WalletMessageSender(api, accountAndWallet.wallet, signer as CellSigner);
        await sender.send(actions);

        return true;
    });
};

export const useEstimateDeploySubscriptionV5 = () => {
    const api = useActiveApi();
    const rawTx = useTonRawTransactionService();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<
        { fee: TransactionFeeTonAsset; address: Address },
        Error,
        SubscriptionEncodingParams
    >(async subscriptionParams => {
        const accountAndWallet = accountsWallets.find(
            w => w.wallet.id === subscriptionParams.fromWallet
        );

        const { wallet, account } = accountAndWallet ?? {};

        if (!account || !wallet) throw new Error('Account or Wallet not found');

        const sender = new WalletMessageSender(api, wallet, estimationSigner);

        const encoder = new SubscriptionV5Encoder(wallet);
        const { actions, extensionAddress } = encoder.encodeCreateSubscriptionV2({
            beneficiary: Address.parse(subscriptionParams.admin),
            subscriptionId: subscriptionParams.subscription_id,
            firstChargingDate: subscriptionParams.first_charging_date,
            paymentPerPeriod: BigInt(subscriptionParams.payment_per_period),
            period: subscriptionParams.period,
            gracePeriod: subscriptionParams.grace_period,
            callerFee: BigInt(subscriptionParams.caller_fee),
            withdrawAddress: Address.parse(subscriptionParams.recipient),
            withdrawMsgBody: subscriptionParams.withdraw_msg_body
        });

        const estimation = await rawTx.estimate(sender, actions);

        return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
    });
};
