import {
    defaultLanguage,
    languages,
    localizationText
} from '@tonkeeper/core/dist/entries/language';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';
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
        // (e.g. "%{coinSymbolWithEx} … amount of %{coinSymbolWithEx}"). Braces escaped; replacement
        // passed as a function so a literal `$` in the value isn't treated as a backreference.
        (acc, [key, val]) =>
            acc.replace(new RegExp('%\\{' + key + '\\}', 'g'), () => val.toString()),
        product
    );
};

export const useTWithReplaces = (tSimple: Translation) => {
    return useCallback(
        (val: string, replaces?: Record<string, string | number>) => {
            // Always expose the brand names so any locale string can reference the configurable
            // native chain/coin via `%{chainName}` / `%{coinName}` / `%{coinSymbol}` /
            // `%{coinSymbolWithEx}`. Per-call `replaces` win over the brand defaults.
            const brand = BRAND_CONFIG;
            const withBrand = {
                chainName: brand.chainName,
                coinName: brand.coinName,
                coinSymbol: brand.coinSymbol,
                coinSymbolWithEx: brand.coinSymbolWithEx,
                ...replaces
            };

            // Forward replaces so i18next can pick the correct plural variant
            // (`key_one` / `key_few` / `key_many` / `key_other`, etc.) per CLDR
            // rules when `count` is provided. Our `%{var}` interpolation is
            // still handled below by `tReplace`; i18next's `{{var}}` syntax is
            // left untouched because we don't use it in our source strings.
            return tReplace(tSimple(val, withBrand), withBrand);
        },
        [tSimple]
    );
};
