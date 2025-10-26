import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useActiveApi, useProCompatibleAccountsWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import {
    prepareSubscriptionParamsForEncoder,
    SubscriptionEncoder,
    SubscriptionEncodingParams
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { QueryKey } from '../../../libs/queryKey';
import { MetaEncryptionSerializedMap } from '@tonkeeper/core/dist/entries/wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { metaEncryptionMapSerializer } from '@tonkeeper/core/dist/utils/metadata';
import { Cell } from '@ton/core';

export const useCreateSubscription = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const client = useQueryClient();
    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    return useMutation<Cell, Error, SubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const { selectedWallet } = subscriptionParams;

        const accountWallet = accountsWallets.find(
            accWallet => accWallet.wallet.id === selectedWallet.id
        );
        const account = accountWallet?.account;
        const accountId = account?.id;

        if (!accountId) throw new Error('Account id is required!');

        let metaEncryptionMap = await sdk.storage
            .get<MetaEncryptionSerializedMap>(AppKey.META_ENCRYPTION_MAP)
            .then(metaEncryptionMapSerializer);

        const shouldCreateMetaKeys = !metaEncryptionMap?.[selectedWallet.rawAddress];

        const signer = await getSigner(sdk, accountId, {
            walletId: selectedWallet.id,
            shouldCreateMetaKeys
        }).catch(() => null);

        if (!signer || signer.type !== 'cell') throw new Error('Signer is incorrect!');

        if (shouldCreateMetaKeys) {
            metaEncryptionMap = await sdk.storage
                .get<MetaEncryptionSerializedMap>(AppKey.META_ENCRYPTION_MAP)
                .then(metaEncryptionMapSerializer);
        }

        const sender = new WalletMessageSender(api, selectedWallet, signer);
        const encoder = new SubscriptionEncoder(selectedWallet);

        const outgoingMsg = await encoder.encodeCreateSubscriptionV2(
            prepareSubscriptionParamsForEncoder(subscriptionParams, metaEncryptionMap)
        );

        const boc = await sender.send(outgoingMsg);

        await client.invalidateQueries([QueryKey.metaEncryptionData]);

        return boc;
    });
};
