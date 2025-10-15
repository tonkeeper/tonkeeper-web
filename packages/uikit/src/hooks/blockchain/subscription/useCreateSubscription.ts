import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
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
import { useTranslation } from '../../translation';
import { QueryKey } from '../../../libs/queryKey';
import { MetaEncryptionSerializedMap } from '@tonkeeper/core/dist/entries/wallet';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { metaEncryptionMapSerializer } from '@tonkeeper/core/dist/utils/metadata';

export const useCreateSubscription = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const { t } = useTranslation();
    const client = useQueryClient();
    const accountsWallets = useProCompatibleAccountsWallets(backwardCompatibilityFilter);

    return useMutation<boolean, Error, SubscriptionEncodingParams>(async subscriptionParams => {
        if (!subscriptionParams) throw new Error('No params');

        const { admin, subscription_id, contract, selectedWallet } = subscriptionParams;

        const accountWallet = accountsWallets.find(
            accWallet => accWallet.wallet.id === selectedWallet.id
        );
        const account = accountWallet?.account;
        const accountId = account?.id;

        if (!accountId) throw new Error('Account id is required!');

        const metaEncryptionMap = await sdk.storage
            .get<MetaEncryptionSerializedMap>(AppKey.META_ENCRYPTION_MAP)
            .then(metaEncryptionMapSerializer);

        const signer = await getSigner(sdk, accountId, {
            walletId: selectedWallet.id,
            shouldCreateMetaKeys: !metaEncryptionMap?.[selectedWallet.rawAddress]
        }).catch(() => null);

        if (!signer || signer.type !== 'cell') throw new Error('Signer is incorrect!');

        const sender = new WalletMessageSender(api, selectedWallet, signer);
        const encoder = new SubscriptionEncoder(selectedWallet);

        const beneficiary = Address.parse(admin);
        const subscriptionId = subscription_id;

        const extensionAddress = encoder.getExtensionAddress({
            beneficiary,
            subscriptionId
        });

        const outgoingMsg = await encoder.encodeCreateSubscriptionV2(
            prepareSubscriptionParamsForEncoder(subscriptionParams, metaEncryptionMap)
        );

        if (!extensionAddress.equals(Address.parse(contract))) {
            throw new Error('Contract extension addresses do not match!');
        }

        await sender.send(outgoingMsg);

        await client.invalidateQueries([QueryKey.metaEncryptionData]);

        return true;
    });
};
