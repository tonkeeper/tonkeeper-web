import browser from 'webextension-polyfill';

let pluralRules: Intl.PluralRules | undefined;

const pluralCategory = (count: number): string => {
    try {
        if (!pluralRules) pluralRules = new Intl.PluralRules(browser.i18n.getUILanguage());
        return pluralRules.select(count);
    } catch {
        return 'other';
    }
};

/**
 * `browser.i18n` has no plural forms, and the locale build emits counted strings only as
 * `key_one` / `key_few` / `key_other` / …, so a `count` picks the entry by the UI language's
 * CLDR rule.
 */
export const browserTranslate = (key: string, replaces?: Record<string, string | number>) => {
    const count = replaces?.count;
    if (typeof count === 'number') {
        const message =
            browser.i18n.getMessage(`${key}_${pluralCategory(count)}`) ||
            browser.i18n.getMessage(`${key}_other`);
        if (message) return message;
    }
    return browser.i18n.getMessage(key);
};
