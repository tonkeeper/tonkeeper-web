import { Address, Cell, internal, SendMode } from '@ton/core';
import { tonConnectAddressIsBounceable, toStateInit } from '../utils';
import { APIConfig } from '../../../entries/apis';
import { WalletOutgoingMessage } from './types';
import { TonConnectTransactionPayloadVariantSelected } from '../../../entries/tonConnect';

export class TonConnectEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeTransfer = async (
        transfer: TonConnectTransactionPayloadVariantSelected
    ): Promise<WalletOutgoingMessage> => {
        let messages = transfer.messages;
        if (transfer.variant !== 'standard' && transfer.messagesVariants?.[transfer.variant]) {
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
