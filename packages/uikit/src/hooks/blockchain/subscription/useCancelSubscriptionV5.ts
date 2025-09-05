import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    SubscriptionV5Encoder,
    type OutActionWalletV5Exported
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { useTonRawTransactionService } from '../useBlockchainService';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';

type CancelParams = {
    fromWallet: WalletId;
    extensionContract: string;
};

export const useCancelSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, CancelParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const accountAndWallet = accountsWallets.find(
            w => w.wallet.id === subscriptionParams.fromWallet
        );

        if (!accountAndWallet) throw new Error('AccountAndWallet not found');

        const signer = await getSigner(sdk, accountAndWallet.account.id, {
            walletId: accountAndWallet.wallet.id
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const extensionAddress = Address.parse(subscriptionParams.extensionContract);

        const encoder = new SubscriptionV5Encoder(accountAndWallet.wallet);

        const destruct = encoder.encodeDestructAction(extensionAddress);

        const remove: OutActionWalletV5Exported = {
            type: 'removeExtension',
            address: extensionAddress
        };

        const actions = [...destruct, remove];

        const sender = new WalletMessageSender(api, accountAndWallet.wallet, signer as CellSigner);
        await sender.send(actions);

        return true;
    });
};

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();
    const rawTx = useTonRawTransactionService();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const accountAndWallet = accountsWallets.find(
                w => w.wallet.id === subscriptionParams.fromWallet
            );

            const { wallet, account } = accountAndWallet ?? {};

            if (!account || !wallet) throw new Error('Account or Wallet not found');

            const sender = new WalletMessageSender(api, wallet, estimationSigner);

            const extensionAddress = Address.parse(subscriptionParams.extensionContract);

            const encoder = new SubscriptionV5Encoder(wallet);

            const destruct = encoder.encodeDestructAction(extensionAddress);

            const remove: OutActionWalletV5Exported = {
                type: 'removeExtension',
                address: extensionAddress
            };

            const actions = [...destruct, remove];

            const estimation = await rawTx.estimate(sender, actions);

            return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
        }
    );
};
