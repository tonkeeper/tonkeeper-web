import { FC } from 'react';

import type { BatteryPurchase } from '../../../../state/battery';
import { BatteryHistorySheetView } from './BatteryHistorySheet';
import { BatteryPurchaseDetailsSheetView } from './BatteryPurchaseDetailsSheet';

const noop = () => {};

const AT = Date.UTC(2026, 8, 12, 14, 3);
const DAY = 24 * 60 * 60 * 1000;

export const HARNESS_PURCHASES: BatteryPurchase[] = [
    {
        id: 4,
        type: 'crypto',
        status: 'completed',
        timestamp: AT,
        charges: 250,
        amount: '1.5',
        currency: 'TON',
        refundable: { charges: 250, amount: '1.5' }
    },
    {
        id: 3,
        type: 'gift',
        status: 'completed',
        timestamp: AT - DAY,
        charges: 120,
        amount: '5.2',
        currency: 'USDT',
        forAccount: '0:8a1f3c2b4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8'
    },
    {
        id: 2,
        type: 'promo-code',
        status: 'refund_pending',
        timestamp: AT - 3 * DAY,
        charges: 40,
        refundable: { charges: 40, amount: '0.24' }
    },
    {
        id: 1,
        type: 'crypto',
        status: 'refunded',
        timestamp: AT - 10 * DAY,
        charges: 400,
        amount: '2.4',
        currency: 'TON',
        refunded: { charges: 400, amount: '2.4' }
    }
];

/** CT mount wrapper for the charges list. `state` picks the non-list outcomes. */
export const BatteryHistorySheetHarness: FC<{
    state?: 'list' | 'loading' | 'empty' | 'error';
    purchases?: BatteryPurchase[];
    onSelect?: (purchase: BatteryPurchase) => void;
    onRetry?: () => void;
}> = ({ state = 'list', purchases = HARNESS_PURCHASES, onSelect = noop, onRetry = noop }) => (
    <BatteryHistorySheetView
        isOpen
        onClose={noop}
        purchases={state === 'list' ? purchases : state === 'empty' ? [] : undefined}
        error={state === 'error'}
        onRetry={onRetry}
        onSelect={onSelect}
    />
);

/** CT mount wrapper for one purchase's details; `purchaseId` picks a fixture. */
export const BatteryPurchaseDetailsHarness: FC<{
    purchaseId?: number;
    refunding?: boolean;
    refunded?: boolean;
    error?: string;
    onRefund?: () => void;
}> = ({ purchaseId = 4, refunding, refunded, error, onRefund = noop }) => {
    const purchase = HARNESS_PURCHASES.find(item => item.id === purchaseId)!;
    return (
        <BatteryPurchaseDetailsSheetView
            isOpen
            onClose={noop}
            purchase={purchase}
            refunding={refunding}
            refunded={refunded ? purchase.refundable : undefined}
            error={error}
            onRefund={onRefund}
        />
    );
};
