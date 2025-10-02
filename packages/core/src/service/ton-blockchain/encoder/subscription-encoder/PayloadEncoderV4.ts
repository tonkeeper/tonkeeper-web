import { Address, Builder, Cell } from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';

import { SUBSCRIPTION_PROTOCOL_TAG } from './constants';
import { EncodedSubscriptionResult, IPayloadEncoder } from './types';

export class PayloadEncoderV4 implements IPayloadEncoder {
    public readonly storeTag = (builder: Builder) => {
        builder.storeUint(SUBSCRIPTION_PROTOCOL_TAG.V4, 8);
    };

    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): EncodedSubscriptionResult {
        return {
            type: 'addAndDeployPlugin',
            workchain: 0,
            stateInit,
            body,
            forwardAmount: deployValue
        };
    }

    encodeDestructAction(extension: Address, destroyValue: bigint): EncodedSubscriptionResult {
        return {
            type: 'removePlugin',
            address: extension,
            forwardAmount: destroyValue
        };
    }
}
