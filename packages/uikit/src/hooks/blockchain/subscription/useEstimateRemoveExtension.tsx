import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import {
    EncodedResultKinds,
    type OutActionWalletV5Exported,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';

import { useActiveApi } from '../../../state/wallet';
import { CancelParams } from './commonTypes';
import {
    ExtensionMessageSender,
    V4ActionTypes
} from '@tonkeeper/core/dist/service/ton-blockchain/sender/extension-message-sender';

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract, destroyValue } = subscriptionParams;

            const extensionAddress = Address.parse(extensionContract);

            const sender = new ExtensionMessageSender(api, selectedWallet, estimationSigner);

            const encoder = new SubscriptionEncoder(selectedWallet);

            let estimation;
            if (selectedWallet.version === WalletVersion.V5R1) {
                const destruct = encoder.encodeDestructAction(
                    extensionAddress,
                    BigInt(destroyValue)
                );

                const remove: OutActionWalletV5Exported = {
                    type: 'removeExtension',
                    address: extensionAddress
                };

                const actions = [...destruct, remove];

                estimation = await sender.estimate({
                    kind: EncodedResultKinds.V5,
                    outgoing: actions
                });
            }

            if (selectedWallet.version === WalletVersion.V4R2) {
                estimation = await sender.estimate({
                    kind: EncodedResultKinds.V4,
                    outgoing: {
                        actionType: V4ActionTypes.DESTRUCT,
                        extensionAddress
                    }
                });
            }

            if (!estimation || estimation.fee?.type !== 'ton-asset') {
                throw new Error('Unsupported wallet version flow!');
            }

            return { fee: estimation.fee, address: extensionAddress };
        }
    );
};
