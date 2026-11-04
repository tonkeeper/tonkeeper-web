import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';

import type { BatteryPurchase, BatteryPurchaseType } from '../../../../state/battery';

export function formatBatteryAmount(amount: string | number, currency: string | undefined): string {
    return formatAmount(amount, { unit: currency && displayCurrency(currency) });
}

/** The relayer prices in the chain coin under its ticker; the UI shows the brand's symbol for it. */
const displayCurrency = (currency: string): string =>
    currency === 'TON' ? BRAND_CONFIG.coinSymbol : currency;

export const purchaseTypeLabelKey: Record<BatteryPurchaseType, string> = {
    crypto: 'battery_history_type_crypto',
    'promo-code': 'battery_history_type_promo',
    gift: 'battery_history_type_gift',
    'on-the-way-gift': 'battery_history_type_gift_on_the_way',
    ios: 'battery_history_type_ios',
    android: 'battery_history_type_android'
};

/** A gift still travelling to its recipient has no charge count yet, only the paid amount. */
export const isGiftOnTheWay = (purchase: Pick<BatteryPurchase, 'type'>): boolean =>
    purchase.type === 'on-the-way-gift';
