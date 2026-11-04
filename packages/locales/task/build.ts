import * as fs from 'fs';
import * as path from 'path';

const namespaces = ['tonkeeper', 'tonkeeper-web'];

const localeMap = {
    'ru-RU': 'ru',
    'tr-TR': 'tr',
    'zh-Hans-CN': 'zh_CN',
    'zh-Hant': 'zh_TW'
};

const dist = './dist';
const src = './src';

const extension = 'extension';
const i18n = 'i18n';
const locales = 'locales';

const defaultLocale = 'en';

interface Message {
    message: string;
    description?: string;
}

const createDirFolders = () => {
    if (fs.existsSync(dist)) {
        fs.rmSync(dist, { recursive: true, force: true });
    }
    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
        fs.mkdirSync(path.join(dist, extension));
        fs.mkdirSync(path.join(dist, i18n));
        fs.mkdirSync(path.join(dist, locales));
    }
};
const fillMissingLocales = (
    resources: Record<string, { translation: Record<string, string> }>,
    defaultResource: Record<string, string>
) => {
    Object.entries(resources).forEach(([locale, { translation }]) => {
        Object.entries(defaultResource).forEach(([key, value]) => {
            if (translation[key] === undefined) {
                translation[key] = value;
            }
        });
    });
};
/**
 * i18next picks a plural suffix through `Intl.PluralRules`, which rejects the underscore codes
 * the extension's `_locales` layout imposes on Chinese (`zh_CN`, `zh_TW`). With no rule i18next
 * looks the bare key up and falls back to English, so those locales get the bare key filled from
 * the `_other` form — the only plural category Chinese has.
 */
const hasPluralRule = (locale: string) => {
    try {
        return new Intl.PluralRules(locale).resolvedOptions().pluralCategories.length > 0;
    } catch {
        return false;
    }
};
const fillPluralBaseKeys = (resources: Record<string, { translation: Record<string, string> }>) => {
    Object.entries(resources).forEach(([locale, { translation }]) => {
        if (hasPluralRule(locale)) {
            return;
        }
        Object.entries(translation).forEach(([key, value]) => {
            const base = key.endsWith('_other') ? key.slice(0, -'_other'.length) : undefined;
            if (base && translation[base] === undefined) {
                translation[base] = value;
            }
        });
    });
};
const writeFiles = (
    resources: Record<string, { translation: Record<string, string> }>,
    defaultResource: Record<string, string>
) => {
    Object.entries(resources).forEach(([locale, { translation }]) => {
        const extensionFormat = Object.entries(translation).reduce((acc, [key, message]) => {
            acc[key] = { message };
            return acc;
        }, {} as Record<string, Message>);

        fs.mkdirSync(path.join(dist, extension, locale));
        fs.writeFileSync(
            path.join(dist, extension, locale, 'messages.json'),
            JSON.stringify(extensionFormat, null, 2)
        );

        fs.mkdirSync(path.join(dist, locales, locale));
        fs.writeFileSync(
            path.join(dist, locales, locale, 'translation.json'),
            JSON.stringify(translation, null, 2)
        );
    });

    fs.writeFileSync(
        path.join(dist, i18n, 'default.json'),
        JSON.stringify({ [defaultLocale]: { translation: defaultResource } }, null, 2)
    );

    fs.writeFileSync(path.join(dist, i18n, 'resources.json'), JSON.stringify(resources, null, 2));
};

const toDict = (parentKey: string | undefined, value: object): Record<string, string> => {
    return Object.entries(value).reduce((acc, [key, message]) => {
        key = key.replace(/\./g, '_').replace(/-/g, '_');
        const item_key = parentKey ? `${parentKey}_${key}` : key;
        if (typeof message === 'string') {
            acc[item_key] = message;
            return acc;
        } else {
            const dict = toDict(item_key, message);
            return { ...acc, ...dict };
        }
    }, {} as Record<string, string>);
};

const main = async () => {
    console.log('----------Build Locales----------');

    createDirFolders();

    let resources: Record<string, { translation: Record<string, string> }> = {};
    let defaultResource: Record<string, string> = {};

    for (let namespace of namespaces) {
        fs.readdirSync(path.join(src, namespace)).forEach(file => {
            const [externalLocale] = file.split('.');

            const locale = localeMap[externalLocale] ?? externalLocale;
            console.log(namespace, locale);

            if (!resources[locale]) {
                resources[locale] = { translation: {} };
            }

            const namespaceFile = fs.readFileSync(path.join(src, namespace, file), 'utf8');
            const namespaceJson: Record<string, string | object> = JSON.parse(namespaceFile);
            const translation = toDict(undefined, namespaceJson);

            resources[locale].translation = {
                ...resources[locale].translation,
                ...translation
            };

            if (defaultLocale === locale) {
                defaultResource = resources[locale].translation;
            }
        });
    }

    fillMissingLocales(resources, defaultResource);
    fillPluralBaseKeys(resources);
    writeFiles(resources, defaultResource);
    checkForDuplicates(resources);

    console.log('----------End Build Locales----------');
};

const checkForDuplicates = (resources: Record<string, { translation: Record<string, string> }>) => {
    Object.entries(resources).forEach(([locale, { translation }]) => {
        const keys = Object.keys(translation);

        const checked = new Map<string, Record<string, string>>();
        keys.forEach(key => {
            if (checked.has(key.toLowerCase())) {
                return;
            }

            const duplicates = keys.filter(k => k.toLowerCase() === key.toLowerCase());
            if (duplicates.length > 1) {
                const values = duplicates.reduce((acc, d) => {
                    return {
                        ...acc,
                        [d]: translation[d]
                    };
                }, {});
                console.error('⚠️ ERR: Find duplicating keys in', `"${locale}"`, 'locale ', values);
                checked.set(key.toLowerCase(), values);
            }
        });
    });
};

main().catch(() => process.exit(1));
