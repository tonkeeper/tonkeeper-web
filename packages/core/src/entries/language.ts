export enum Language {
    EN = 0,
    RU = 1,
    IT = 2,
    'zh-Hans-CN' = 3
}

export const defaultLanguage: Language = Language.EN;

export const languages = [Language.EN, Language.RU, Language.IT, Language['zh-Hans-CN']];

export const localizationSecondaryText = (lang: Language): string => {
    switch (lang) {
        case Language.EN:
            return 'English';
        case Language.RU:
            return 'Русский';
        case Language.IT:
            return 'Italiano';
        case Language['zh-Hans-CN']:
            return '简体中文（中国）';
    }
};

export const localizationText = (lang?: Language) => {
    switch (lang) {
        case Language.EN:
            return 'en';
        case Language.RU:
            return 'ru';
        case Language.IT:
            return 'it';
        case Language['zh-Hans-CN']:
            return 'zh-Hans-CN';
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
        case 'it':
            return Language.IT;
        case 'zh-Hans-CN':
            return Language['zh-Hans-CN'];
        default:
            return Language.EN;
    }
};
