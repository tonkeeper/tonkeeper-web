/**
 * SINGLE SOURCE OF TRUTH for the native chain & coin DISPLAY names.
 *
 * To rebrand, edit {@link BRAND_CONFIG} below — it is the only place these names are defined.
 * Nothing else in the code or locales should hardcode "TON" / "Toncoin" as a display string;
 * import {@link BRAND_CONFIG} instead, and use the `%{chainName}` / `%{coinName}` / `%{coinSymbol}`
 * placeholders in locale strings.
 *
 * These are DISPLAY values only. They must NOT be confused with protocol/API identifiers, which
 * always stay the literal `'TON'` and are intentionally left hardcoded:
 *   - `BLOCKCHAIN_NAME.TON` / `CryptoCurrency.TON`
 *   - `TON_ASSET.address` and the asset id from `packAssetId(BLOCKCHAIN_NAME.TON, 'TON')`
 *   - rate/currency keys sent to backends (e.g. `getRates({ tokens: ['TON'] })`)
 * Changing any of those would break balances, asset matching and backend calls.
 *
 */
export interface BrandConfig {
    /** Display name of the chain, e.g. used in "... in the TON network". */
    chainName: string;
    /** Full name of the native coin, e.g. "Toncoin". */
    coinName: string;
    /**
     * PURE ticker/symbol of the native coin, e.g. "GRAM". Use this next to amounts and anywhere a
     * value might be passed onward (analytics, etc.) — never the transitional {@link coinSymbolWithEx}.
     */
    coinSymbol: string;
    /**
     * Transitional DISPLAY-ONLY ticker with the old name in parentheses, e.g. "GRAM (ex TON)".
     * Use only as a standalone label where we want to surface the rename; NEVER send to an API or
     * use as an identifier — use {@link coinSymbol} for that.
     */
    coinSymbolWithEx: string;
}

export const BRAND_CONFIG: BrandConfig = {
    chainName: 'TON',
    coinName: 'Gram (ex\u00A0Toncoin)',
    coinSymbol: 'GRAM',
    coinSymbolWithEx: 'GRAM (ex\u00A0TON)'
};
