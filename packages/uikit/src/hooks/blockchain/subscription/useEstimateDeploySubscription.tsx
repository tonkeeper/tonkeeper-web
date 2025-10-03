import { useMutation } from '@tanstack/react-query';
import { TransactionFeeTonAsset } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { Address } from '@ton/core';
import { SubscriptionEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/subscription-encoder';
import {
    assertBalanceEnough,
    estimationSigner
} from '@tonkeeper/core/dist/service/ton-blockchain/utils';

import { SubscriptionEncodingParams } from './commonTypes';
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
        const {
            admin,
            subscription_id,
            first_charging_date,
            payment_per_period,
            period,
            grace_period,
            caller_fee,
            recipient,
            withdraw_msg_body,
            selectedWallet,
            deploy_value,
            metadata
        } = subscriptionParams;

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

        const outgoingMsg = await encoder.encodeCreateSubscriptionV2({
            beneficiary,
            subscriptionId,
            firstChargingDate: first_charging_date,
            paymentPerPeriod: BigInt(payment_per_period),
            deployValue: BigInt(deploy_value),
            period,
            gracePeriod: grace_period,
            callerFee: BigInt(caller_fee),
            withdrawAddress: Address.parse(recipient),
            withdrawMsgBody: withdraw_msg_body,
            metadata,
            walletMetaKeyPair: metaEncryptionMap[selectedWallet.rawAddress].keyPair
        });

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
