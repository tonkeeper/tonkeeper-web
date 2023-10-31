import { intlLocale } from '../entries/language';

const defaultFormat = 'en-US';
const defaultDecimalsSeparator = '.';
const defaultGroupSeparator = ',';

export function getBrowserLocale() {
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    if (isSafari) {
        return 'fr-FR';
    }

    const browserLocales =
        navigator.languages === undefined ? [navigator.language] : navigator.languages;
    if (!browserLocales || !browserLocales.length) {
        return defaultFormat;
    }

    return intlLocale(browserLocales[0]);
}

export function getSeparator(locale: string, separatorType: 'decimal' | 'group') {
    const numberWithGroupAndDecimalSeparator = 1000.1;

    return Intl.NumberFormat(intlLocale(locale))
        .formatToParts(numberWithGroupAndDecimalSeparator)
        .find(part => part.type === separatorType)?.value;
}

export const getDecimalSeparator = () => {
    const locale = getBrowserLocale();
    return getSeparator(locale, 'decimal') ?? defaultDecimalsSeparator;
};

export const getNotDecimalSeparator = () => {
    const separator = getDecimalSeparator();
    return { '.': ',', ',': '.' }[separator] as string;
};

export const getGroupSeparator = () => {
    const locale = getBrowserLocale();
    return getSeparator(locale, 'group') ?? defaultGroupSeparator;
};
