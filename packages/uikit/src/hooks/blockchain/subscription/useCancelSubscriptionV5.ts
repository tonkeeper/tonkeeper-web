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
    OutActionWalletV5
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';

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
            walletId: accountAndWallet.wallet.id
        }).catch(() => null);

        if (!signer) throw new Error('Signer not found');

        const extensionAddress = Address.parse(subscriptionParams.extensionAddress);

        const encoder = new SubscriptionV5Encoder();

        const destruct = encoder.encodeDestructAction(extensionAddress);

        const remove: OutActionWalletV5 = { type: 'removeExtension', address: extensionAddress };

        const actions = [...destruct, remove];

        const sender = new WalletMessageSender(api, accountAndWallet.wallet, signer as CellSigner);
        await sender.send(actions);

        return true;
    });
};
