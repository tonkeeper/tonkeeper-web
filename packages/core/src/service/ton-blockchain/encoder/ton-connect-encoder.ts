import { Address, Cell, SendMode } from '@ton/core';
import { tonConnectAddressIsBounceable, toStateInit } from '../utils';
import { APIConfig } from '../../../entries/apis';
import { WalletOutgoingMessage } from './types';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '../../../entries/tonConnect';
import { EncoderBase } from './encoder-base';

export class TonConnectEncoder extends EncoderBase {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {
        super();
    }

    encodeTransfer = async (
        transfer: TonConnectTransactionPayload & {
            variant: TON_CONNECT_MSG_VARIANTS_ID | 'standard';
        }
    ): Promise<WalletOutgoingMessage> => {
        let messages = transfer.messages;
        if (transfer.variant !== 'standard') {
            if (!transfer.messagesVariants?.[transfer.variant]) {
                throw new Error(
                    `TonConnect message payload for selected variant ${transfer.variant} is not provided`
                );
            }

            messages = transfer.messagesVariants[transfer.variant]!.messages;
        }

        return {
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: await Promise.all(
                messages.map(async item =>
                    this.internalMessage({
                        to: Address.parse(item.address),
                        bounce: await tonConnectAddressIsBounceable(this.api, item.address),
                        value: this.currencyValue({
                            amount: item.amount,
                            extra_currency: item.extra_currency
                        }),
                        init: toStateInit(item.stateInit),
                        body: item.payload ? Cell.fromBase64(item.payload) : undefined
                    })
                )
            )
        };
    };
}
