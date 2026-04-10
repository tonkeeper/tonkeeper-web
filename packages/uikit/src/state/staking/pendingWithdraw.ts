import BigNumber from 'bignumber.js';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';

export const MIN_PENDING_WITHDRAW_TON = new BigNumber('0.000001');

export function isSignificantPendingWithdraw(pendingWithdrawRaw: number): boolean {
    if (pendingWithdrawRaw <= 0) {
        return false;
    }
    const pendingTon = shiftedDecimals(pendingWithdrawRaw);
    return !pendingTon.lt(MIN_PENDING_WITHDRAW_TON);
}
