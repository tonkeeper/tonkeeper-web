import { Address, Cell, internal, SendMode } from '@ton/core';
import { seeIfAddressBounceable, toStateInit } from '../../transfer/common';
import { APIConfig } from '../../../entries/apis';
import { WalletOutgoingMessage } from './types';
import { TonConnectTransactionPayload } from '../../../entries/tonConnect';

export class TonConnectEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeTransfer = async (
        transfer: TonConnectTransactionPayload
    ): Promise<WalletOutgoingMessage> => {
        return {
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS,
            messages: transfer.messages.map(item =>
                internal({
                    to: Address.parse(item.address),
                    bounce: seeIfAddressBounceable(item.address),
                    value: BigInt(item.amount),
                    init: toStateInit(item.stateInit),
                    body: item.payload ? Cell.fromBase64(item.payload) : undefined
                })
            )
        };
    };
}
