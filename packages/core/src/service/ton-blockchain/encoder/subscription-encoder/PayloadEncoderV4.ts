import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';
import { Address, Builder, Cell, internal, MessageRelaxed } from '@ton/core';
import { WalletV4ExtendedAction } from '@ton/ton/dist/wallets/v4/WalletContractV4Actions';

import { IPayloadEncoder } from './types';
import { SUBSCRIPTION_PROTOCOL_TAG } from './constants';

export class PayloadEncoderV4 implements IPayloadEncoder {
    public readonly storeTag = (builder: Builder) => {
        builder.storeUint(SUBSCRIPTION_PROTOCOL_TAG.V4, 8);
    };

    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): WalletV4ExtendedAction {
        return {
            type: 'addAndDeployPlugin',
            workchain: 0,
            stateInit,
            body,
            forwardAmount: deployValue
        };
    }

    encodeDestructAction(extension: Address, destroyValue: bigint): WalletV4ExtendedAction {
        return {
            type: 'removePlugin',
            address: extension,
            forwardAmount: destroyValue
        };
    }

    getInternalFromAction(outgoingMsg: WalletV4ExtendedAction, to: Address): MessageRelaxed {
        switch (outgoingMsg.type) {
            case 'addAndDeployPlugin':
                return internal({
                    to,
                    bounce: true,
                    value: outgoingMsg.forwardAmount,
                    init: outgoingMsg.stateInit,
                    body: outgoingMsg.body
                });

            case 'addPlugin':
                return internal({
                    to: outgoingMsg.address,
                    bounce: true,
                    value: outgoingMsg.forwardAmount,
                    body: Cell.EMPTY
                });

            case 'removePlugin':
                return internal({
                    to: outgoingMsg.address,
                    bounce: true,
                    value: outgoingMsg.forwardAmount,
                    body: Cell.EMPTY
                });

            case 'sendMsg':
                if (!outgoingMsg.messages.length) {
                    throw new Error('sendMsg without messages');
                }

                return outgoingMsg.messages[0];

            default:
                throw new Error('Unsupported V4 action type!');
        }
    }
}
