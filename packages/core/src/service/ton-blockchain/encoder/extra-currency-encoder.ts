import {
    Address,
    Cell,
    CurrencyCollection,
    Dictionary,
    MessageRelaxed,
    SendMode,
    StateInit
} from '@ton/core';
import { userInputAddressIsBounceable } from '../utils';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../../entries/apis';
import { MessagePayloadParam, serializePayload, WalletOutgoingMessage } from './types';

export class ExtraCurrencyEncoder {
    constructor(private readonly api: APIConfig, private readonly _walletAddress: string) {}

    encodeTransfer = async (
        transfer:
            | {
                  id: number;
                  to: string;
                  weiAmount: BigNumber;
                  payload?: MessagePayloadParam;
              }
            | {
                  id: number;
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

    private extraCurrencyValue(src: { id: number; weiAmount: BigNumber }): CurrencyCollection {
        const other = Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(5));

        other.set(src.id, BigInt(src.weiAmount.toFixed(0)));

        return { coins: BigInt('0'), other };
    }

    private internalMessage(src: {
        to: Address;
        value: CurrencyCollection;
        bounce: boolean;
        init?: StateInit;
        body?: Cell;
    }): MessageRelaxed {
        return {
            info: {
                type: 'internal',
                dest: src.to,
                value: src.value,
                bounce: src.bounce,
                ihrDisabled: true,
                bounced: false,
                ihrFee: 0n,
                forwardFee: 0n,
                createdAt: 0,
                createdLt: 0n
            },
            init: src.init ?? undefined,
            body: src.body ?? Cell.EMPTY
        };
    }

    private encodeSingleTransfer = async ({
        id,
        to,
        weiAmount,
        payload
    }: {
        id: number;
        to: string;
        weiAmount: BigNumber;
        payload?: MessagePayloadParam;
    }): Promise<WalletOutgoingMessage> => {
        const message = this.internalMessage({
            to: Address.parse(to),
            bounce: await userInputAddressIsBounceable(this.api, to),
            value: this.extraCurrencyValue({ id, weiAmount }),
            body: serializePayload(payload)
        });

        return {
            messages: [message],
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };

    private encodeMultiTransfer = async (
        transfers: {
            id: number;
            to: string;
            weiAmount: BigNumber;
            bounce: boolean;
            payload?: MessagePayloadParam;
        }[]
    ): Promise<WalletOutgoingMessage> => {
        return {
            messages: transfers.map(transfer =>
                this.internalMessage({
                    to: Address.parse(transfer.to),
                    bounce: transfer.bounce,
                    value: this.extraCurrencyValue({
                        id: transfer.id,
                        weiAmount: transfer.weiAmount
                    }),
                    body: serializePayload(transfer.payload)
                })
            ),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };
}
