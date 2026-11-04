/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import en from '../../../packages/locales/src/migration/en.json';
import { resolveLocale } from './i18n';
import { StorageSnapshot } from './storage';

const LOCALES = import.meta.glob<Record<string, string>>(
    '../../../packages/locales/src/migration/*.json',
    { eager: true, import: 'default' }
);

const PUBLIC_KEY = 'a'.repeat(64);

const snapshot = (entries: Record<string, unknown>): StorageSnapshot =>
    Object.fromEntries(
        Object.entries(entries).map(([key, payload]) => [
            `tonkeeper_${key}`,
            JSON.stringify({ payload })
        ])
    );

const placeholders = (text: string): string[] => (text.match(/%\{\w+\}/g) ?? []).sort();

describe('resolveLocale', () => {
    it('falls back to English when nothing was picked', () => {
        expect(resolveLocale({})).toBe('en');
    });

    it('reads the language picked in the wallet settings', () => {
        expect(resolveLocale(snapshot({ language: 1 }))).toBe('ru-RU');
        expect(resolveLocale(snapshot({ language: 3 }))).toBe('zh-Hans-CN');
    });

    it("reads the active wallet's language from the layout that predates the key", () => {
        const deprecated = snapshot({
            account: { publicKeys: [PUBLIC_KEY], activePublicKey: PUBLIC_KEY },
            [`wallet_${PUBLIC_KEY}`]: { lang: 18 }
        });

        expect(resolveLocale(deprecated)).toBe('de');
    });

    it('falls back to English for a value it does not know', () => {
        expect(resolveLocale(snapshot({ language: 99 }))).toBe('en');
        expect(resolveLocale(snapshot({ language: 'ru' }))).toBe('en');
    });
});

describe('locale files', () => {
    const files = Object.entries(LOCALES).filter(([path]) => !path.endsWith('/en.json'));

    it('has every language the wallet can be set to', () => {
        expect(files).toHaveLength(19);
    });

    it.each(files)('%s translates every key, with the same placeholders', (_, messages) => {
        for (const [key, text] of Object.entries(en)) {
            expect(messages[key], key).toBeTypeOf('string');
            expect(placeholders(messages[key]), key).toEqual(placeholders(text));
        }
    });
});
