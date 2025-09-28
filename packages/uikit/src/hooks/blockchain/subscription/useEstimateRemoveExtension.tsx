import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import { estimationSigner } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { SubscriptionEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';

import { useActiveApi } from '../../../state/wallet';
import { CancelParams } from './commonTypes';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract, destroyValue } = subscriptionParams;

            const extensionAddress = Address.parse(extensionContract);

            const encoder = new SubscriptionEncoder(selectedWallet);
            const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

            const { outgoingMsg } = encoder.encodeDestructAction(
                extensionAddress,
                BigInt(destroyValue)
            );

            const estimation = await sender.estimate(outgoingMsg);

            return { fee: estimation.fee, address: extensionAddress };
        }
    );
};
