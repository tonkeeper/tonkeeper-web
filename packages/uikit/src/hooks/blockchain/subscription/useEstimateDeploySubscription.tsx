import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import {
    prepareSubscriptionParamsForEncoder,
    SubscriptionEncoder,
    SubscriptionEncodingParams
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import {
    assertBalanceEnough,
    estimationSigner
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';

import { useActiveApi, useMetaEncryptionData } from '../../../state/wallet';
import { WalletMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BlockchainApi } from '@tonkeeper/core/dist/tonApiV2';
import { estimateWalletContractExecutionGasFee } from '@tonkeeper/core/dist/service/wallet/contractService';

export const useEstimateDeploySubscription = () => {
    const api = useActiveApi();
    const { data: metaEncryptionMap } = useMetaEncryptionData();

    return useMutation<
        { fee: TransactionFeeTonAsset; address: Address },
        Error,
        SubscriptionEncodingParams
    >(async subscriptionParams => {
        const { admin, subscription_id, selectedWallet, deploy_value } = subscriptionParams;

        if (!metaEncryptionMap || !metaEncryptionMap[selectedWallet.rawAddress]) {
            throw new Error('walletMetaKeyPair is missed!');
        }

        const sender = new WalletMessageSender(api, selectedWallet, estimationSigner);
        const encoder = new SubscriptionEncoder(selectedWallet);

        const beneficiary = Address.parse(admin);
        const subscriptionId = subscription_id;

        const extensionAddress = encoder.getExtensionAddress({
            beneficiary,
            subscriptionId
        });

        const config = await new BlockchainApi(api.tonApiV2).getBlockchainConfig();

        const outgoingMsg = await encoder.encodeCreateSubscriptionV2(
            prepareSubscriptionParamsForEncoder(subscriptionParams, metaEncryptionMap)
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
            executionGasFee + BigInt(deploy_value),
            TON_ASSET,
            selectedWallet.rawAddress
        );

        const estimation = await sender.estimate(outgoingMsg);

        return {
            fee: estimation.fee,
            address: extensionAddress
        };
    });
};
