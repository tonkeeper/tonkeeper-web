import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { formatter } from '../../hooks/balance';
import { isSignificantPendingWithdraw } from './pendingWithdraw';

type StakingTranslate = (key: string, options?: Record<string, string>) => string;

export type StakingPendingPositionSlice = {
    pendingDeposit?: number;
    readyWithdraw?: number;
    pendingWithdraw?: number;
};

export function hasAnySignificantPendingStakingSubtitle(
    position: StakingPendingPositionSlice | undefined
): boolean {
    if (!position) {
        return false;
    }
    return (
        isSignificantPendingWithdraw(position.pendingDeposit ?? 0) ||
        isSignificantPendingWithdraw(position.readyWithdraw ?? 0) ||
        isSignificantPendingWithdraw(position.pendingWithdraw ?? 0)
    );
}

export function getStakingPendingCycleLine(
    t: StakingTranslate,
    pendingWithdrawRaw: number,
    countdown: string | null | undefined
): string {
    if (!isSignificantPendingWithdraw(pendingWithdrawRaw)) {
        return '';
    }
    const amount = formatter.formatDisplay(shiftedDecimals(pendingWithdrawRaw));
    return countdown
        ? t('staking_portfolio_pending_withdraw_countdown', { amount, value: countdown })
        : t('staking_portfolio_pending_withdraw', { amount });
}

export function getStakingPendingSubtitleLine(
    t: StakingTranslate,
    position: StakingPendingPositionSlice | undefined,
    countdown: string | null | undefined
): string | undefined {
    if (!position) {
        return undefined;
    }

    const pw = position.pendingWithdraw ?? 0;
    if (isSignificantPendingWithdraw(pw)) {
        return getStakingPendingCycleLine(t, pw, countdown);
    }

    const rw = position.readyWithdraw ?? 0;
    if (isSignificantPendingWithdraw(rw)) {
        return t('staking_ready_withdraw', {
            amount: formatter.formatDisplay(shiftedDecimals(rw))
        });
    }

    const pd = position.pendingDeposit ?? 0;
    if (isSignificantPendingWithdraw(pd)) {
        return t('staking_pending_deposit', {
            amount: formatter.formatDisplay(shiftedDecimals(pd))
        });
    }

    return undefined;
}
