import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import {
    type OutActionWalletV5Exported,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';

import { useActiveApi } from '../../../state/wallet';
import { CancelParams } from './commonTypes';

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract } = subscriptionParams;

            const extensionAddress = Address.parse(extensionContract);
            const rawTx = new TonRawTransactionService(api, selectedWallet);
            const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

            const encoder = new SubscriptionEncoder(selectedWallet);

            if (selectedWallet.version >= WalletVersion.V5R1) {
                const destruct = encoder.encodeDestructAction(extensionAddress);

                const remove: OutActionWalletV5Exported = {
                    type: 'removeExtension',
                    address: extensionAddress
                };

                const actions = [...destruct, remove];

                const estimation = await rawTx.estimate(sender, actions);

                return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
            }

            const body = encoder.buildDestructBody();

            const approximationTx = {
                to: extensionAddress,
                value: SubscriptionEncoder.DEFAULT_V4_REMOVE_EXTENSION_AMOUNT,
                bounce: true,
                body
            };

            const estimation = await rawTx.estimate(sender, approximationTx);

            return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
        }
    );
};
