import { Address, internal, SendMode } from '@ton/core';
import { userInputAddressIsBounceable } from '../utils';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../../entries/apis';
import { MessagePayloadParam, serializePayload, WalletOutgoingMessage } from './types';

export class TonEncoder {
    constructor(private readonly api: APIConfig) {}

    encodeTransfer = async (
        transfer:
            | {
                  to: string;
                  weiAmount: BigNumber;
                  isMax?: boolean;
                  payload?: MessagePayloadParam;
              }
            | {
                  to: string;
                  weiAmount: BigNumber;
                  bounce: boolean;
                  payload?: MessagePayloadParam;
              }[]
    ): Promise<WalletOutgoingMessage> => {
        if (Array.isArray(transfer)) {
            return this.encodeMultiTransfer(transfer);
        } else {
            return this.encodeSingleTransfer(transfer);
        }
    };

    private encodeSingleTransfer = async ({
        to,
        weiAmount,
        payload,
        isMax
    }: {
        to: string;
        weiAmount: BigNumber;
        isMax?: boolean;
        payload?: MessagePayloadParam;
    }): Promise<WalletOutgoingMessage> => {
        const message = internal({
            to: Address.parse(to),
            bounce: await userInputAddressIsBounceable(this.api, to),
            value: BigInt(weiAmount.toFixed(0)),
            body: serializePayload(payload)
        });

        return {
            messages: [message],
            sendMode: isMax
                ? SendMode.CARRY_ALL_REMAINING_BALANCE + SendMode.IGNORE_ERRORS
                : SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };

    private encodeMultiTransfer = async (
        transfers: {
            to: string;
            weiAmount: BigNumber;
            bounce: boolean;
            payload?: MessagePayloadParam;
        }[]
    ): Promise<WalletOutgoingMessage> => {
        return {
            messages: transfers.map(transfer =>
                internal({
                    to: Address.parse(transfer.to),
                    bounce: transfer.bounce,
                    value: BigInt(transfer.weiAmount.toFixed(0)),
                    body: serializePayload(transfer.payload)
                })
            ),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };
}
