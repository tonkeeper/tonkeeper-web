import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { QueryKey } from '../../../libs/queryKey';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';

type CancelParams = {
    selectedWallet: TonWalletStandard;
    extensionContract: string;
};

export const useCancelSubscriptionV5 = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();
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

        if (!signer || signer.type !== 'cell') throw new Error('Signer is incorrect!');

        const extensionAddress = Address.parse(extensionContract);

        const encoder = new SubscriptionV5Encoder(selectedWallet);

        const destruct = encoder.encodeDestructAction(extensionAddress);

        const remove: OutActionWalletV5Exported = {
            type: 'removeExtension',
            address: extensionAddress
        };

        const actions = [...destruct, remove];

        const sender = new WalletMessageSender(api, selectedWallet, signer);
        await sender.send(actions);

        await client.invalidateQueries([QueryKey.pro]);

        return true;
    });
};

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract } = subscriptionParams;

            const rawTx = new TonRawTransactionService(api, selectedWallet);
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
