import {
    defaultLanguage,
    languages,
    localizationText
} from '@tonkeeper/core/dist/entries/language';
import React, { useContext } from 'react';

export type Translation = (text: string) => string;

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
