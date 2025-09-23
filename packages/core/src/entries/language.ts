export enum Language {
    EN = 0,
    RU = 1,
    IT = 2,
    zh_CN = 3,
    TR = 4,
    BG = 5,
    ES = 6,
    ID = 7,
    UK = 8,
    UZ = 9,
    BN = 10,
    zh_TW = 11,
    FR = 12,
    PA = 13,
    PT = 14,
    VI = 15
}

export const defaultLanguage: Language = Language.EN;

export const languages = [
    Language.EN,
    Language.RU,
    Language.IT,
    Language.zh_TW,
    Language.zh_CN,
    Language.TR,
    Language.BG,
    Language.ES,
    Language.ID,
    Language.UK,
    Language.UZ,
    Language.BN,
    Language.FR,
    Language.PA,
    Language.PT,
    Language.VI
];

export const localizationText = (lang?: Language) => {
    switch (lang) {
        case Language.EN:
            return 'en';
        case Language.RU:
            return 'ru';
        case Language.IT:
            return 'it';
        case Language.zh_CN:
            return 'zh_CN';
        case Language.zh_TW:
            return 'zh_TW';
        case Language.TR:
            return 'tr';
        case Language.BG:
            return 'bg';
        case Language.ES:
            return 'es';
        case Language.ID:
            return 'id';
        case Language.UK:
            return 'uk';
        case Language.UZ:
            return 'uz';
        case Language.BN:
            return 'bn';
        case Language.FR:
            return 'fr';
        case Language.PA:
            return 'pa';
        case Language.PT:
            return 'pt';
        case Language.VI:
            return 'vi';
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
        case 'zh_CN':
            return Language.zh_CN;
        case 'zh_TW':
            return Language.zh_TW;
        case 'tr':
            return Language.TR;
        case 'bg':
            return Language.BG;
        case 'es':
            return Language.ES;
        case 'id':
            return Language.ID;
        case 'uk':
            return Language.UK;
        case 'uz':
            return Language.UZ;
        case 'bn':
            return Language.BN;
        case 'fr':
            return Language.FR;
        case 'pa':
            return Language.PA;
        case 'pt':
            return Language.PT;
        case 'vi':
            return Language.VI;
        default:
            return Language.EN;
    }
};

const localeMap: Record<string, string> = {
    zh_CN: 'zh-Hans',
    zh_TW: 'zh-Hant'
};

export const intlLocale = (locale: string) => {
    return localeMap[locale] ?? locale;
};
