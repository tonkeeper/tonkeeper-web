import { Address } from '@ton/core/dist/address/Address';
import { Cell } from '@ton/core/dist/boc/Cell';
import { Dictionary } from '@ton/core/dist/dict/Dictionary';
import type { CurrencyCollection } from '@ton/core/dist/types/CurrencyCollection';
import type { MessageRelaxed } from '@ton/core/dist/types/MessageRelaxed';
import type { StateInit } from '@ton/core/dist/types/StateInit';
import BigNumber from 'bignumber.js';

export abstract class EncoderBase {
    private getOtherDict = () => {
        return Dictionary.empty(Dictionary.Keys.Uint(32), Dictionary.Values.BigVarUint(5));
    };

    protected currencyValue(src: {
        amount: string | number;
        extra_currency:
            | {
                  [k: number]: string;
              }
            | undefined;
    }): CurrencyCollection {
        const coins = BigInt(src.amount);

        if (!src.extra_currency) {
            return { coins };
        }

        const other = this.getOtherDict();
        for (const [id, value] of Object.entries(src.extra_currency)) {
            other.set(Number(id), BigInt(value));
        }
        return { coins, other };
    }

    protected extraCurrencyValue(src: { id: number; weiAmount: BigNumber }): CurrencyCollection {
        const other = this.getOtherDict();

        other.set(src.id, BigInt(src.weiAmount.toFixed(0)));

        return { coins: BigInt('0'), other };
    }

    protected internalMessage(src: {
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
}
