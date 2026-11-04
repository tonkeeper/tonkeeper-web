import BigNumber from 'bignumber.js';

/**
 * Visual state of the battery glyph. Numeric levels map to the design
 * library's `ic-battery-<level>-*` icons; `empty` and `negative` render the
 * flash glyph in the accent and the alert colour respectively.
 */
export type BatteryLevel = 'negative' | 'empty' | 10 | 25 | 50 | 75 | 100;

/**
 * TON balance that renders the battery as full. The native apps treat
 * roughly 2000 charges as a full battery, which at the mean fee is ~4 TON.
 */
export const BATTERY_FULL_TON_BALANCE = new BigNumber(4);

/**
 * Picks the battery glyph for a relayer balance expressed in TON: the level
 * nearest to the fill, since the native apps draw the fill continuously. A
 * refunded purchase can push the balance below zero — that is not spendable
 * debt but an alert state, so it gets its own glyph instead of `empty`.
 */
export function getBatteryLevel(tonBalance: BigNumber): BatteryLevel {
    if (tonBalance.isNegative()) {
        return 'negative';
    }
    if (tonBalance.isZero()) {
        return 'empty';
    }
    const fill = tonBalance.div(BATTERY_FULL_TON_BALANCE);
    if (fill.lt(0.175)) return 10;
    if (fill.lt(0.375)) return 25;
    if (fill.lt(0.625)) return 50;
    if (fill.lt(0.875)) return 75;
    return 100;
}
