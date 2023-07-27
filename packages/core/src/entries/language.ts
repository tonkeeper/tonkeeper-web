export enum Language {
    EN = 0,
    RU = 1
}

export const defaultLanguage: Language = Language.EN;

export const languages = [Language.EN, Language.RU];

export const localizationSecondaryText = (lang: Language): string => {
    switch (lang) {
        case Language.EN:
            return 'English';
        case Language.RU:
            return 'Русский';
    }
};

export const localizationText = (lang?: Language) => {
    switch (lang) {
        case Language.EN:
            return 'en';
        case Language.RU:
            return 'ru';
        default:
            return 'en';
    }
};

export const localizationFrom = (lang: string) => {
    switch (lang) {
        case 'en':
            return Language.EN;
        case 'ru':
            return Language.RU;
        default:
            return Language.EN;
    }
};
