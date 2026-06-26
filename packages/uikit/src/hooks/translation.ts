import {
    defaultLanguage,
    languages,
    localizationText
} from '@tonkeeper/core/dist/entries/language';
import {
    BRAND_CONFIG,
    getBrandCoinName,
    getBrandCoinSymbolWithEx
} from '@tonkeeper/core/dist/config/brand';
import React, { useCallback, useContext } from 'react';

export type Translation = (text: string, replaces?: Record<string, string | number>) => string;

export interface I18nClient {
    enable: boolean;
    reloadResources: (langs: string[]) => Promise<void>;
    changeLanguage: (lang: string) => Promise<void>;
    language: string;
    languages: string[];
}

export interface I18nContext {
    t: Translation;
    i18n: I18nClient;
}

export const TranslationContext = React.createContext<I18nContext>({
    t: text => text,
    i18n: {
        enable: false,
        reloadResources: async () => {},
        changeLanguage: async () => {},
        language: localizationText(defaultLanguage),
        languages: [...languages].map(localizationText)
    }
});

export const useTranslation = () => {
    return useContext(TranslationContext);
};

export const tReplace = (product: string, replaces?: Record<string, string | number>) => {
    if (!replaces) {
        return product;
    }

    return Object.entries(replaces).reduce(
        // Global flag so placeholders that appear more than once in a string are all replaced
        // (e.g. "%{coinSymbol} … amount of %{coinSymbol}"). Braces escaped; replacement
        // passed as a function so a literal `$` in the value isn't treated as a backreference.
        (acc, [key, val]) => acc.replace(new RegExp('%\\{' + key + '\\}', 'g'), () => val.toString()),
        product
    );
};

export const useTWithReplaces = (tSimple: Translation, language?: string) => {
    return useCallback(
        (val: string, replaces?: Record<string, string | number>) => {
            // Always expose the brand names so any locale string can reference the configurable
            // native chain/coin via `%{chainName}` / `%{coinName}` / `%{coinSymbol}`. Per-call
            // `replaces` win over the brand defaults. `coinName` is language-dependent (English uses
            // "prev.", other languages "ex-"), so it is resolved from the active UI `language`.
            const withBrand = {
                chainName: BRAND_CONFIG.chainName,
                coinName: getBrandCoinName(language),
                coinSymbol: BRAND_CONFIG.coinSymbol,
                ...replaces
            };

            // Forward replaces so i18next can pick the correct plural variant
            // (`key_one` / `key_few` / `key_many` / `key_other`, etc.) per CLDR
            // rules when `count` is provided. Our `%{var}` interpolation is
            // still handled below by `tReplace`; i18next's `{{var}}` syntax is
            // left untouched because we don't use it in our source strings.
            return tReplace(tSimple(val, withBrand), withBrand);
        },
        [tSimple, language]
    );
};

/**
 * Active-language native-coin name ("Gram (prev. Toncoin)" / "Gram (ex-Toncoin)") for use in
 * components. Use wherever the former "Toncoin" display name appeared.
 */
export const useBrandCoinName = (): string => {
    const { i18n } = useTranslation();
    return getBrandCoinName(i18n.language);
};

/**
 * Active-language transitional with-ex ticker ("GRAM (prev. TON)" / "GRAM (ex-TON)").
 * Used ONLY by the home-page native-coin cell; everywhere else use `BRAND_CONFIG.coinSymbol`.
 */
export const useBrandCoinSymbolWithEx = (): string => {
    const { i18n } = useTranslation();
    return getBrandCoinSymbolWithEx(i18n.language);
};
