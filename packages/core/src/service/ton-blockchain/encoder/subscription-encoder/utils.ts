import { Address } from '@ton/core';

import { IMetaEncryptionData } from '../../../../entries/wallet';
import { DeployParams, SubscriptionEncodingParams } from './types';

export const prepareSubscriptionParamsForEncoder = (
    subscriptionParams: SubscriptionEncodingParams,
    metaEncryptionMap: Record<string, IMetaEncryptionData> | null
): DeployParams => {
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
        throw new Error('No walletMetaKeyPair found!');
    }

    return {
        beneficiary: Address.parse(admin),
        subscriptionId: subscription_id,
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
    };
};
