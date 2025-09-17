import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import { TonRawTransactionService } from '@tonkeeper/core/dist/service/ton-blockchain/ton-raw-transaction.service';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import {
    estimationSigner,
    externalMessage,
    getWalletSeqNo
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import {
    type OutActionWalletV5Exported,
    SubscriptionEncoder
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import { WalletVersion } from '@tonkeeper/core/dist/entries/wallet';
import { walletContractFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { EmulationApi } from '@tonkeeper/core/dist/tonApiV2';

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

            let estimation;
            if (selectedWallet.version === WalletVersion.V5R1) {
                const destruct = encoder.encodeDestructAction(extensionAddress);

                const remove: OutActionWalletV5Exported = {
                    type: 'removeExtension',
                    address: extensionAddress
                };

                const actions = [...destruct, remove];

                estimation = await rawTx.estimate(sender, actions);

                return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
            }

            if (selectedWallet.version === WalletVersion.V4R2) {
                const seqno = await getWalletSeqNo(api, selectedWallet.rawAddress);

                const unsigned = encoder.buildV4RemoveExtensionUnsignedBody({
                    seqno,
                    extensionAddress
                });

                const body = encoder.buildV4SignedBody(Buffer.alloc(64), unsigned);

                const walletContract = walletContractFromState(selectedWallet);
                const externalCell = externalMessage(walletContract, seqno, body);

                estimation = await new EmulationApi(api.tonApiV2).emulateMessageToWallet({
                    emulateMessageToWalletRequest: { boc: externalCell.toBoc().toString('base64') }
                });
            }

            if (!estimation) {
                throw new Error('Unsupported wallet version flow!');
            }

            return { fee: estimation.fee as TransactionFeeTonAsset, address: extensionAddress };
        }
    );
};
