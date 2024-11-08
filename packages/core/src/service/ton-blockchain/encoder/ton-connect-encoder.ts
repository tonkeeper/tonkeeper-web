import { Address, Cell, internal, SendMode } from '@ton/core';
import { tonConnectAddressIsBounceable, toStateInit } from '../utils';
import { APIConfig } from '../../../entries/apis';
import { WalletOutgoingMessage } from './types';
import {
    TON_CONNECT_MSG_VARIANTS_ID,
    TonConnectTransactionPayload
} from '../../../entries/tonConnect';

export class TonConnectEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

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

            messages = transfer.messagesVariants[transfer.variant]!;
        }

        return {
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: await Promise.all(
                messages.map(async item =>
                    internal({
                        to: Address.parse(item.address),
                        bounce: await tonConnectAddressIsBounceable(this.api, item.address),
                        value: BigInt(item.amount),
                        init: toStateInit(item.stateInit),
                        body: item.payload ? Cell.fromBase64(item.payload) : undefined
                    })
                )
            )
        };
    };
}
