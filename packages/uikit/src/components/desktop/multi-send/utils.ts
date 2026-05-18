import { MultiSendForm } from '../../../state/multiSend';
import BigNumber from 'bignumber.js';
import { formatter } from '../../../hooks/balance';
import { inputToBigNumber } from '@tonkeeper/core/dist/utils/send';

export function getWillBeMultiSendValue(
    rowsValue: MultiSendForm['rows'],
    asset: { decimals: number; symbol: string },
    rate: { prices: number } | undefined
) {
    const bnAmounts = rowsValue.map(item => {
        if (!item.amount?.value) {
            return BigNumber(0);
        }

        const bnInput = inputToBigNumber(item.amount.value);
        let inToken = bnInput;
        if (item.amount.inFiat) {
            inToken = rate?.prices ? new BigNumber(bnInput).div(rate.prices) : new BigNumber(0);
        }

        return new BigNumber(inToken);
    });

    const willBeSentBN = bnAmounts.reduce((acc, item) => {
        return acc.plus(new BigNumber(item));
    }, new BigNumber(0));

    const willBeSent =
        formatter.format(willBeSentBN, {
            decimals: asset.decimals
        }) +
        ' ' +
        asset.symbol;

    return { willBeSent, willBeSentBN, bnAmounts };
}
