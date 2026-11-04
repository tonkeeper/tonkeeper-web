/**
 * The strings this app shows, in the language the wallet was set to on this
 * origin. The locale files live with every other translation, in
 * `packages/locales/src/migration`, but in a namespace of their own: the
 * wallet's build never flattens it in, and this bundle never carries the
 * wallet's strings. English ships in the bundle; any other locale is one lazy
 * chunk, fetched before the first render.
 */

import en from '../../../packages/locales/src/migration/en.json';
import type { AccountLabel, AccountName } from './accounts';
import { readLanguage, StorageSnapshot } from './storage';

export type Messages = typeof en;
export type MessageKey = keyof Messages;

type PluralBase = {
    [K in MessageKey]: K extends `${infer Base}_other` ? Base : never;
}[MessageKey];

const LOCALE_FILES = import.meta.glob<{ default: Partial<Messages> }>(
    '../../../packages/locales/src/migration/*.json'
);

/**
 * Mirrors the `Language` enum in `packages/core/src/entries/language.ts`: the
 * stored value is the enum's number, mapped here to the locale file's name.
 */
const LANGUAGE_FILES: Record<number, string> = {
    0: 'en',
    1: 'ru-RU',
    2: 'it',
    3: 'zh-Hans-CN',
    4: 'tr-TR',
    5: 'bg',
    6: 'es',
    7: 'id',
    8: 'uk',
    9: 'uz',
    10: 'bn',
    11: 'zh-Hant',
    12: 'fr',
    13: 'pa',
    14: 'pt',
    15: 'vi',
    16: 'hi',
    17: 'ar',
    18: 'de',
    19: 'fa'
};

const DEFAULT_LOCALE = 'en';

/**
 * The locale of the language picked in the wallet's settings on this origin.
 * With none picked the wallet shows English, so this does too.
 */
export const resolveLocale = (snapshot: StorageSnapshot): string => {
    const language = readLanguage(snapshot);

    return (language !== undefined && LANGUAGE_FILES[language]) || DEFAULT_LOCALE;
};

/** The BCP 47 tag for `<html lang>` and plural rules. */
const languageTag = (locale: string): string => locale.replace('-Hans-CN', '-Hans');

let messages: Messages = en;
let pluralRules = new Intl.PluralRules(DEFAULT_LOCALE);

/**
 * A key missing from a locale falls back to English, so a gap degrades to
 * English rather than to a raw key; so does a chunk that fails to load.
 */
export const loadLocale = async (locale: string): Promise<void> => {
    const load = LOCALE_FILES[`../../../packages/locales/src/migration/${locale}.json`];

    if (locale !== DEFAULT_LOCALE && load) {
        try {
            messages = { ...en, ...(await load()).default };
            pluralRules = new Intl.PluralRules(languageTag(locale));
        } catch {
            messages = en;
        }
    }

    document.documentElement.lang = languageTag(messages === en ? DEFAULT_LOCALE : locale);
    document.title = messages.page_title;
};

type Vars = Record<string, string | number>;

const interpolate = (text: string, vars?: Vars): string =>
    vars
        ? text.replace(/%\{(\w+)\}/g, (match, name: string) =>
              name in vars ? String(vars[name]) : match
          )
        : text;

export const t = (key: MessageKey, vars?: Vars): string => interpolate(messages[key], vars);

/** Picks `_one` / `_few` / `_many` / `_other` by the locale's plural rules. */
export const tPlural = (base: PluralBase, count: number, vars?: Vars): string => {
    const key = `${base}_${pluralRules.select(count)}` as MessageKey;

    return interpolate(messages[key] ?? messages[`${base}_other` as MessageKey], {
        count,
        ...vars
    });
};

/**
 * A string whose placeholders are elements rather than text — a host shown in
 * the emphasis colour, a wallet shown with its avatar. The translated sentence
 * decides where they sit, so it is split around them rather than assembled.
 */
export const tParts = <T>(key: MessageKey, parts: Record<string, T>): (string | T)[] =>
    messages[key]
        .split(/(%\{\w+\})/)
        .filter(Boolean)
        .map(piece => {
            const name = /^%\{(\w+)\}$/.exec(piece)?.[1];

            return name && name in parts ? parts[name] : piece;
        });

export const accountNameText = (name: AccountName): string => {
    if ('custom' in name) {
        return name.custom;
    }

    return 'ordinal' in name
        ? t('account_default_name', { number: name.ordinal })
        : t('wallet_default_name');
};

export const accountLabelText = (label: AccountLabel): string =>
    'address' in label ? label.address : tPlural('wallet_count', label.walletCount);

/** "Name, address" — how a subtitle names the account a screen acts on. */
export const accountTitleText = (account: { name: AccountName; label?: AccountLabel }): string =>
    account.label
        ? `${accountNameText(account.name)}, ${accountLabelText(account.label)}`
        : accountNameText(account.name);
