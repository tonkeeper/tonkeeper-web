import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useProCompatibleAccountsWallets, useActiveApi } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { SubscriptionEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { QueryKey } from '../../../libs/queryKey';
import { CancelParams } from './commonTypes';
import { Address } from '@ton/core';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';

export const useCancelSubscription = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();
    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, CancelParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const { selectedWallet, extensionContract, destroyValue } = subscriptionParams;

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

        const sender = new WalletMessageSender(api, selectedWallet, signer);
        const encoder = new SubscriptionEncoder(selectedWallet);

        const outgoingMsg = encoder.encodeDestructAction(extensionAddress, BigInt(destroyValue));

        await sender.send(outgoingMsg);

        await client.invalidateQueries([QueryKey.pro]);

        return true;
    });
};
