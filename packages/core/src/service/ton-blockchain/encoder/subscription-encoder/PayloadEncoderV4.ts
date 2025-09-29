import { Address, Builder, Cell, contractAddress } from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';
import { WalletV4ExtendedAction } from '@ton/ton/dist/wallets/v4/WalletContractV4Actions';
import {
    EncodedSubscriptionResult,
    IPayloadEncoder,
    SUBSCRIPTION_PROTOCOL_TAG
} from './subscription-encoder';

export class PayloadEncoderV4 implements IPayloadEncoder {
    public readonly storeTag = (builder: Builder) => {
        builder.storeUint(SUBSCRIPTION_PROTOCOL_TAG.V4, 8);
    };

    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): EncodedSubscriptionResult {
        const extensionAddress = contractAddress(0, stateInit);

        return {
            outgoingMsg: {
                type: 'addAndDeployPlugin',
                workchain: 0,
                stateInit,
                body,
                forwardAmount: deployValue
            },
            extensionAddress
        };
    }

    encodeDestructAction(extension: Address, destroyValue: bigint): EncodedSubscriptionResult {
        const action: WalletV4ExtendedAction = {
            type: 'removePlugin',
            address: extension,
            forwardAmount: destroyValue
        };
        return { outgoingMsg: action, extensionAddress: extension };
    }
}
