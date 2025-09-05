import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useActiveApi, useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    SubscriptionV5Encoder,
    type OutActionWalletV5Exported
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { useTonRawTransactionService } from '../useBlockchainService';
import { TransactionFee } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

type CancelParams = {
    fromWallet: WalletId;
    extensionAddress: string;
};

export const useCancelSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(account => account.allTonWallets.map(wallet => ({ wallet, account })));

    return useMutation<boolean, Error, CancelParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const accountAndWallet = wallets.find(w => w.wallet.id === subscriptionParams.fromWallet);

        if (!accountAndWallet) throw new Error('AccountAndWallet not found');

        const signer = await getSigner(sdk, accountAndWallet.account.id, {
            walletId: subscriptionParams.fromWallet
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const extensionAddress = Address.parse(subscriptionParams.extensionAddress);

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
    const accounts = useAccountsState();
    const api = useActiveApi();
    const rawTx = useTonRawTransactionService();

    return useMutation<{ fee: TransactionFee; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const account = accounts
                .filter(isAccountTonWalletStandard)
                .find(a => a.allTonWallets.some(w => w.id === subscriptionParams.fromWallet));
            if (!account) throw new Error('Wallet not found');

            const wallet = account.allTonWallets.find(w => w.id === subscriptionParams.fromWallet)!;

            const sender = new WalletMessageSender(api, wallet, estimationSigner);

            const extensionAddress = Address.parse(subscriptionParams.extensionAddress);

            const encoder = new SubscriptionV5Encoder(wallet);

            const destruct = encoder.encodeDestructAction(extensionAddress);

            const remove: OutActionWalletV5Exported = {
                type: 'removeExtension',
                address: extensionAddress
            };

            const actions = [...destruct, remove];

            const estimation = await rawTx.estimate(sender, actions);

            return { fee: estimation.fee, address: extensionAddress };
        }
    );
};
