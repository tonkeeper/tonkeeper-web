import { Address, internal } from '@ton/core';
import { seeIfTransferBounceable } from '../transfer/common';

export class TonEncoder {
    static encodeTransfer(address: string) {
        return internal({
            to: Address.parse(recipient.toAccount.address),
            bounce: seeIfTransferBounceable(recipient.toAccount, recipient.address),
            value: BigInt(weiAmount.toFixed(0)),
            body: recipient.comment !== '' ? recipient.comment : undefined
        });
    }
}
