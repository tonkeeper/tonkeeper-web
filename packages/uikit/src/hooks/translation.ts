import {
    defaultLanguage,
    languages,
    localizationText
} from '@tonkeeper/core/dist/entries/language';
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
        (acc, [key, val]) => acc.replace(new RegExp('%{' + key + '}'), val.toString()),
        product
    );
};

export const useTWithReplaces = (tSimple: Translation) => {
    return useCallback(
        (val: string, replaces?: Record<string, string | number>) =>
            tReplace(tSimple(val), replaces),
        [tSimple]
    );
};
