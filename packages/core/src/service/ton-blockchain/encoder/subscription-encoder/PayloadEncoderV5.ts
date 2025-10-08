import {
    Address,
    beginCell,
    Builder,
    Cell,
    contractAddress,
    internal,
    MessageRelaxed,
    SendMode
} from '@ton/core';
import { StateInit as TonStateInit } from '@ton/core/dist/types/StateInit';
import { OutActionWalletV5 } from '@ton/ton/dist/wallets/v5beta/WalletV5OutActions';

import { IPayloadEncoder } from './types';
import { getTonkeeperQueryId } from '../../utils';
import { OP, SUBSCRIPTION_PROTOCOL_TAG } from './constants';

export class PayloadEncoderV5 implements IPayloadEncoder {
    public readonly storeTag = (builder: Builder) => {
        builder.storeUint(SUBSCRIPTION_PROTOCOL_TAG.V5, 8);
    };

    encodeCreateSubscription(
        body: Cell,
        stateInit: TonStateInit,
        deployValue: bigint
    ): OutActionWalletV5[] {
        const extensionAddress = contractAddress(0, stateInit);

        const initMsg = internal({
            to: extensionAddress,
            bounce: true,
            value: deployValue,
            init: stateInit,
            body
        });

        return [
            { type: 'addExtension', address: extensionAddress },
            {
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                outMsg: initMsg
            }
        ];
    }

    encodeDestructAction(extension: Address, destroyValue: bigint): OutActionWalletV5[] {
        const outMsg = internal({
            to: extension,
            bounce: true,
            value: destroyValue,
            body: this.buildDestructBody()
        });

        return [
            {
                type: 'sendMsg',
                mode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
                outMsg
            },
            { type: 'removeExtension', address: extension }
        ];
    }

    getInternalFromAction(outgoingMsg: OutActionWalletV5[]): MessageRelaxed {
        const sendMsgAction = outgoingMsg.find(a => a.type === 'sendMsg');

        if (sendMsgAction?.type !== 'sendMsg' || !sendMsgAction?.outMsg) {
            throw new Error('No sendMsg action with outMsg found');
        }

        return sendMsgAction.outMsg;
    }

    private buildDestructBody(): Cell {
        return beginCell()
            .storeUint(OP.DESTRUCT, 32)
            .storeUint(getTonkeeperQueryId(), 64)
            .endCell();
    }
}
