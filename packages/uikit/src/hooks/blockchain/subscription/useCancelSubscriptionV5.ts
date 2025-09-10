import { useMutation } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
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
    selectedWallet: TonWalletStandard;
    extensionContract: string;
};

export const useCancelSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const accountsWallets = useAccountWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, CancelParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const { selectedWallet, extensionContract } = subscriptionParams;

        const accountWallet = accountsWallets.find(
            accWallet => accWallet.wallet.id === selectedWallet.id
        );
        const accountId = accountWallet?.account?.id;

        if (!accountId) throw new Error('Account id is required!');

        const signer = await getSigner(sdk, accountId, {
            walletId: selectedWallet.id
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const extensionAddress = Address.parse(extensionContract);

        const encoder = new SubscriptionV5Encoder(selectedWallet);

        const destruct = encoder.encodeDestructAction(extensionAddress);

        const remove: OutActionWalletV5Exported = {
            type: 'removeExtension',
            address: extensionAddress
        };

        const actions = [...destruct, remove];

        const sender = new WalletMessageSender(api, selectedWallet, signer as CellSigner);
        await sender.send(actions);

        return true;
    });
};

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();
    const rawTx = useTonRawTransactionService();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract } = subscriptionParams;

            const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

            const extensionAddress = Address.parse(extensionContract);

            const encoder = new SubscriptionV5Encoder(selectedWallet);

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
