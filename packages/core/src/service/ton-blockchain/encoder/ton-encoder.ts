import { Address, internal } from '@ton/core';
import { getIsBlockchainAccountBounceable, SendMode } from '../../transfer/common';
import BigNumber from 'bignumber.js';
import { APIConfig } from '../../../entries/apis';
import { WalletOutgoingMessage } from './types';

export class TonEncoder {
    constructor(private readonly api: APIConfig, private readonly walletAddress: string) {}

    encodeTransfer = async (
        transfer:
            | {
                  to: string;
                  weiAmount: BigNumber;
                  comment?: string;
                  isMax: boolean;
              }
            | {
                  to: string;
                  weiAmount: BigNumber;
                  bounce: boolean;
                  comment?: string;
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
        comment,
        isMax
    }: {
        to: string;
        weiAmount: BigNumber;
        comment?: string;
        isMax: boolean;
    }): Promise<WalletOutgoingMessage> => {
        const message = internal({
            to: Address.parse(to),
            bounce: await getIsBlockchainAccountBounceable(this.api, to),
            value: BigInt(weiAmount.toFixed(0)),
            body: comment || undefined
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
            comment?: string;
        }[]
    ): Promise<WalletOutgoingMessage> => {
        return {
            messages: transfers.map(transfer =>
                internal({
                    to: Address.parse(transfer.to),
                    bounce: transfer.bounce,
                    value: BigInt(transfer.weiAmount.toFixed(0)),
                    body: transfer.comment || undefined
                })
            ),
            sendMode: SendMode.PAY_GAS_SEPARATELY + SendMode.IGNORE_ERRORS
        };
    };
}
