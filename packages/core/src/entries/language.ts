export enum Language {
    EN = 0,
    RU = 1,
    IT = 2,
    'zh-Hans-CN' = 3,
    'tr-TR' = 4
}

export const defaultLanguage: Language = Language.EN;

export const languages = [
    Language.EN,
    Language.RU,
    Language.IT,
    Language['zh-Hans-CN'],
    Language['tr-TR']
];

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
        case Language['tr-TR']:
            return 'tr-TR';
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
        case 'tr-TR':
            return Language['tr-TR'];
        default:
            return Language.EN;
    }
};
