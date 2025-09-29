import { Address, beginCell, Builder, Cell, contractAddress, internal, SendMode } from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';
import {
    EncodedSubscriptionResult,
    IPayloadEncoder,
    OP,
    SUBSCRIPTION_PROTOCOL_TAG
} from './subscription-encoder';
import { getTonkeeperQueryId } from '../../utils';

export class PayloadEncoderV5 implements IPayloadEncoder {
    public readonly storeTag = (builder: Builder) => {
        builder.storeUint(SUBSCRIPTION_PROTOCOL_TAG.V5, 8);
    };

    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): EncodedSubscriptionResult {
        const extensionAddress = contractAddress(0, stateInit);

        const initMsg = internal({
            to: extensionAddress,
            bounce: true,
            value: deployValue,
            init: stateInit,
            body
        });

        const actions: OutActionWalletV5[] = [
            { type: 'addExtension', address: extensionAddress },
            {
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                outMsg: initMsg
            }
        ];

        return { outgoingMsg: actions, extensionAddress };
    }

    encodeDestructAction(extension: Address, destroyValue: bigint): EncodedSubscriptionResult {
        const outMsg = internal({
            to: extension,
            bounce: true,
            value: destroyValue,
            body: this.buildDestructBody()
        });

        const actions: OutActionWalletV5[] = [
            {
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                outMsg
            },
            { type: 'removeExtension', address: extension }
        ];

        return { outgoingMsg: actions, extensionAddress: extension };
    }

    private buildDestructBody(): Cell {
        return beginCell()
            .storeUint(OP.DESTRUCT, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .endCell();
    }
}
