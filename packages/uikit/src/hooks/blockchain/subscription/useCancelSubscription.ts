import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountWallets, useActiveApi } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import {
    EncodedResultKinds,
    type OutActionWalletV5Exported,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { QueryKey } from '../../../libs/queryKey';
import { CancelParams } from './commonTypes';
import {
    ExtensionMessageSender,
    V4ActionTypes
} from '@tonkeeper/core/dist/service/ton-blockchain/sender/extension-message-sender';

export const useCancelSubscription = () => {
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

        const encoder = new SubscriptionEncoder(selectedWallet);

        const sender = new ExtensionMessageSender(api, selectedWallet, signer);

        if (selectedWallet.version === WalletVersion.V5R1) {
            const destruct = encoder.encodeDestructAction(extensionAddress);

            const remove: OutActionWalletV5Exported = {
                type: 'removeExtension',
                address: extensionAddress
            };

            const actions = [...destruct, remove];

            await sender.send({ kind: EncodedResultKinds.V5, outgoing: actions });

            await client.invalidateQueries([QueryKey.pro]);

            return true;
        }

        if (selectedWallet.version === WalletVersion.V4R2) {
            await sender.send({
                kind: EncodedResultKinds.V4,
                outgoing: {
                    actionType: V4ActionTypes.DESTRUCT,
                    extensionAddress
                }
            });

            await client.invalidateQueries([QueryKey.pro]);

            return true;
        }

        throw new Error('Unsupported wallet version flow');
    });
};
