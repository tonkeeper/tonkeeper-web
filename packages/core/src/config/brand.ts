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
 * Naming rules (rebrand to Gram):
 *   - The PURE ticker {@link BrandConfig.coinSymbol} ("GRAM") is shown EVERYWHERE a ticker appears
 *     (history, Ton Connect, staking, etc.) — and is language-independent.
 *   - The transitional ticker-with-old-name ({@link getBrandCoinSymbolWithEx}) is shown in EXACTLY
 *     ONE place: the native-coin cell on the home page.
 *   - The full coin name ({@link getBrandCoinName}) replaces every former "Toncoin" display string.
 *   - Both transitional values are LANGUAGE-DEPENDENT: English uses "(prev. …)", every other
 *     language uses "(ex-…)". Resolve them via the helpers below given the active UI language.
 */
export interface BrandConfig {
    /** Display name of the chain, e.g. used in "... in the TON network". */
    chainName: string;
    /** Full name of the native coin in English, e.g. "Gram (prev. Toncoin)". */
    coinName_En: string;
    /** Full name of the native coin in non-English languages, e.g. "Gram (ex-Toncoin)". */
    coinName_notEn: string;
    /**
     * PURE ticker/symbol of the native coin, e.g. "GRAM". Use this next to amounts and anywhere a
     * value might be passed onward (analytics, etc.) — never the transitional with-ex variants.
     * Language-independent.
     */
    coinSymbol: string;
    /**
     * Transitional DISPLAY-ONLY ticker with the old name in parentheses, English variant,
     * e.g. "GRAM (prev. TON)". Home-page coin cell only; NEVER send to an API or use as an id.
     */
    coinSymbolWithEx_En: string;
    /** Transitional DISPLAY-ONLY ticker with the old name, non-English variant, e.g. "GRAM (ex-TON)". */
    coinSymbolWithEx_notEn: string;
    /** Native coin icon data URI. */
    coinIcon: string;
    /** Native chain/network icon data URI. */
    chainIcon: string;
}

/** True when the active UI language is English (the only language using the "(prev. …)" wording). */
export const isEnglishLanguage = (language?: string): boolean =>
    !language || language.toLowerCase().startsWith('en');

/**
 * Resolve the full native-coin name ("Gram (prev. Toncoin)" / "Gram (ex-Toncoin)") for the active
 * UI language. Pass the i18n language; defaults to the English variant when unknown.
 */
export const getBrandCoinName = (language?: string): string =>
    isEnglishLanguage(language) ? BRAND_CONFIG.coinName_En : BRAND_CONFIG.coinName_notEn;

/**
 * Resolve the transitional with-ex ticker ("GRAM (prev. TON)" / "GRAM (ex-TON)") for the active UI
 * language. Used ONLY by the home-page coin cell.
 */
export const getBrandCoinSymbolWithEx = (language?: string): string =>
    isEnglishLanguage(language)
        ? BRAND_CONFIG.coinSymbolWithEx_En
        : BRAND_CONFIG.coinSymbolWithEx_notEn;

// Native coin icon, inlined so every platform (incl. desktop/iOS, which don't self-host static
// assets) bundles it without a remote request or per-app copies. Edit the SVG markup below to
// rebrand; the data URI is derived from it at load time (core is tsc-compiled and can't import
// an .svg file).
const NATIVE_COIN_ICON_SVG =
    `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="none"><rect width="100" height="100" fill="#30a1f5" rx="50"/><rect width="99" height="99" x=".5" y=".5" stroke="#000" stroke-opacity=".06" rx="49.5"/><path fill="#fff" d="M60.41 26.75H39.59c-2.772 0-4.159 0-5.413.388a8.7 8.7 0 0 0-3.028 1.653c-1.005.846-1.754 2.012-3.254 4.344L21.277 43.43c-.99 1.54-1.486 2.311-1.62 3.122-.119.715-.04 1.45.228 2.123.304.764.951 1.411 2.247 2.707l24.59 24.59c1.148 1.148 1.721 1.722 2.383 1.936.582.19 1.208.19 1.79 0 .661-.214 1.235-.788 2.382-1.935l24.591-24.591c1.296-1.296 1.943-1.943 2.247-2.707a4 4 0 0 0 .228-2.123c-.134-.81-.63-1.581-1.62-3.122l-6.618-10.295c-1.5-2.332-2.25-3.498-3.254-4.344a8.7 8.7 0 0 0-3.028-1.653c-1.255-.388-2.64-.388-5.414-.388z"/><path fill="#30a1f5" d="M56.469 34.871c.338-.914 1.631-.914 1.97 0l2.337 6.317c.14.38.44.679.819.82l6.317 2.337c.914.338.914 1.63 0 1.97l-6.317 2.337c-.38.14-.679.44-.82.818l-2.337 6.317c-.338.915-1.631.915-1.97 0l-2.337-6.317a1.39 1.39 0 0 0-.819-.818l-6.316-2.338c-.915-.338-.915-1.631 0-1.97l6.316-2.337c.38-.14.679-.44.82-.819z"/></svg>`;
const NATIVE_COIN_ICON = `data:image/svg+xml,${encodeURIComponent(NATIVE_COIN_ICON_SVG)}`;

// Native chain/network icon.
const NATIVE_CHAIN_ICON_SVG =
    `<svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_6563_126)"><circle cx="22" cy="22" r="22" fill="#0098EA"/><path d="M29.514 12.1001H14.4898C11.7274 12.1001 9.97653 15.08 11.3663 17.4888L20.6386 33.5605C21.2437 34.6098 22.7601 34.6098 23.3651 33.5605L32.6394 17.4888C34.0273 15.0837 32.2764 12.1001 29.5159 12.1001H29.514ZM20.6311 28.7409L18.6117 24.8326L13.7392 16.118C13.4177 15.5602 13.8148 14.8455 14.4879 14.8455H20.6292V28.7428L20.6311 28.7409ZM30.2608 16.1161L25.3902 24.8345L23.3708 28.7409V14.8436H29.5121C30.1852 14.8436 30.5823 15.5583 30.2608 16.1161Z" fill="white"/></g><defs><clipPath id="clip0_6563_126"><rect width="44" height="44" fill="white"/></clipPath></defs></svg>`;
const NATIVE_CHAIN_ICON = `data:image/svg+xml,${encodeURIComponent(NATIVE_CHAIN_ICON_SVG)}`;

export const BRAND_CONFIG: BrandConfig = {
    chainName: 'TON',
    coinName_En: 'Gram (prev.\u00A0Toncoin)',
    coinName_notEn: 'Gram (ex-Toncoin)',
    coinSymbol: 'GRAM',
    coinSymbolWithEx_En: 'GRAM (prev.\u00A0TON)',
    coinSymbolWithEx_notEn: 'GRAM (ex-TON)',
    coinIcon: NATIVE_COIN_ICON,
    chainIcon: NATIVE_CHAIN_ICON
};
