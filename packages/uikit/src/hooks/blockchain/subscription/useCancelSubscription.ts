import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Address } from '@ton/core';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { useActiveApi, useAccountWallets } from '../../../state/wallet';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    SubscriptionEncoder,
    type OutActionWalletV5Exported
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { externalMessage, getWalletSeqNo } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { backwardCompatibilityFilter } from '@tonkeeper/core/dist/service/proService';
import { QueryKey } from '../../../libs/queryKey';
import { CancelParams } from './commonTypes';

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

        if (selectedWallet.version === WalletVersion.V5R1) {
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
        }

        if (selectedWallet.version === WalletVersion.V4R2) {
            const seqno = await getWalletSeqNo(api, selectedWallet.rawAddress);

            const unsigned = encoder.buildV4RemoveExtensionUnsignedBody({
                seqno,
                extensionAddress
            });

            const signature: Buffer = await signer(unsigned);

            const body = encoder.buildV4SignedBody(signature, unsigned);

            const walletContract = walletContractFromState(selectedWallet);
            const externalCell = externalMessage(walletContract, seqno, body);

            await new BlockchainApi(api.tonApiV2).sendBlockchainMessage({
                sendBlockchainMessageRequest: { boc: externalCell.toBoc().toString('base64') }
            });

            await client.invalidateQueries([QueryKey.pro]);

            return true;
        }

        throw new Error('Unsupported wallet version flow');
    });
};
