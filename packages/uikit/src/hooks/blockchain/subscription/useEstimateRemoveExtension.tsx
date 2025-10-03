import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import {
    assertBalanceEnough,
    estimationSigner
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { SubscriptionEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';

import { useActiveApi } from '../../../state/wallet';
import { CancelParams } from './commonTypes';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { estimateWalletContractExecutionGasFee } from '@tonkeeper/core/dist/service/wallet/contractService';

export const useEstimateRemoveExtension = () => {
    const api = useActiveApi();

    return useMutation<{ fee: TransactionFeeTonAsset; address: Address }, Error, CancelParams>(
        async subscriptionParams => {
            const { selectedWallet, extensionContract, destroyValue } = subscriptionParams;

            const extensionAddress = Address.parse(extensionContract);

            const config = await new BlockchainApi(api.tonApiV2).getBlockchainConfig();

            const encoder = new SubscriptionEncoder(selectedWallet);
            const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);

            const outgoingMsg = encoder.encodeDestructAction(
                extensionAddress,
                BigInt(destroyValue)
            );

            const inMsg = await sender.toExternal(outgoingMsg);
            const inMsgBocHex = inMsg.toBoc().toString('hex');

            const outMsgBocHex = encoder.getOutMsgBocHex(outgoingMsg, extensionAddress);

            const executionGasFee = estimateWalletContractExecutionGasFee(config, {
                walletVersion: selectedWallet.version,
                inMsgBocHex,
                outMsgBocHex
            });

            await assertBalanceEnough(
                api,
                executionGasFee + BigInt(destroyValue),
                TON_ASSET,
                selectedWallet.rawAddress
            );

            const estimation = await sender.estimate(outgoingMsg);

            return { fee: estimation.fee, address: extensionAddress };
        }
    );
};
