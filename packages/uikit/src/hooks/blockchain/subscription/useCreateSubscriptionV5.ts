import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { useActiveApi, useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
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

type SubscriptionEncodingParams = {
    fromWallet: WalletId;
} & SubscriptionExtension;

export const useCreateSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(account => account.allTonWallets.map(wallet => ({ wallet, account })));

    return useMutation<boolean, Error, SubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const accountAndWallet = wallets.find(w => w.wallet.id === subscriptionParams.fromWallet);

        if (!accountAndWallet) throw new Error('AccountAndWallet not found');

        const signer = await getSigner(sdk, accountAndWallet.account.id, {
            walletId: subscriptionParams.fromWallet
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
    const accounts = useAccountsState();
    const api = useActiveApi();
    const rawTx = useTonRawTransactionService();

    return useMutation<
        { fee: TransactionFeeTonAsset; address: Address },
        Error,
        SubscriptionEncodingParams
    >(async subscriptionParams => {
        const account = accounts
            .filter(isAccountTonWalletStandard)
            .find(a => a.allTonWallets.some(w => w.id === subscriptionParams.fromWallet));

        if (!account) throw new Error('Wallet not found');

        const wallet = account.allTonWallets.find(w => w.id === subscriptionParams.fromWallet)!;

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
