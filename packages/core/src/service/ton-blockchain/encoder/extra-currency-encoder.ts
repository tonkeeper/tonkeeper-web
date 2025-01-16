import { Address, SendMode } from '@ton/core';
import { userInputAddressIsBounceable } from '../utils';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../../entries/apis';
import { MessagePayloadParam, serializePayload, WalletOutgoingMessage } from './types';
import { EncoderBase } from './encoder-base';

export class ExtraCurrencyEncoder extends EncoderBase {
    constructor(private readonly api: APIConfig, private readonly _walletAddress: string) {
        super();
    }

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
