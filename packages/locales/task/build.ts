import * as dotenv from 'dotenv';
import * as fs from 'fs';
import fetch from 'node-fetch';
import * as path from 'path';
import * as unzipper from 'unzipper';

dotenv.config();

const namespaces = ['tonkeeper', 'tonkeeper-web'];

const localeMap = {
    'ru-RU': 'ru'
};

const dist = './dist';

const source = 'source';

const extension = 'extension';
const i18n = 'i18n';
const locales = 'locales';

const defaultLocale = 'en';

interface Message {
    message: string;
    description?: string;
}

const loadTransactions = async () => {
    const file = await fetch(
        `https://app.tolgee.io/v2/projects/export?ak=${process.env.TOLGEE_TOKEN}`
    );

    const zipFile = path.join(dist, source, 'translations.zip');
    fs.writeFileSync(zipFile, await file.buffer());

    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
            .pipe(unzipper.Extract({ path: path.join(dist, source) }))
            .on('close', () => {
                console.log('Files loaded and unzipped successfully');
                resolve(undefined);
            })
            .on('error', reject);
    });
};

const fillMissingLocales = (
    resources: Record<string, { translation: Record<string, string> }>,
    defaultResource: Record<string, string>
) => {
    Object.entries(resources).forEach(([locale, { translation }]) => {
        Object.entries(defaultResource).forEach(([key, value]) => {
            if (translation[key] == undefined) {
                translation[key] = value;
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

    if (!fs.existsSync(dist)) {
        fs.mkdirSync(dist);
    }
    if (!fs.existsSync(path.join(dist, source))) {
        fs.mkdirSync(path.join(dist, source));
    }
    if (!fs.existsSync(path.join(dist, extension))) {
        fs.mkdirSync(path.join(dist, extension));
    }
    if (!fs.existsSync(path.join(dist, i18n))) {
        fs.mkdirSync(path.join(dist, i18n));
    }
    if (!fs.existsSync(path.join(dist, locales))) {
        fs.mkdirSync(path.join(dist, locales));
    }

    await loadTransactions();

    let resources: Record<string, { translation: Record<string, string> }> = {};
    let defaultResource: Record<string, string> = {};

    for (let namespace of namespaces) {
        fs.readdirSync(path.join(dist, source, namespace)).forEach(file => {
            const [externalLocale] = file.split('.');

            const locale = localeMap[externalLocale] ?? externalLocale;
            console.log(namespace, locale);

            if (!resources[locale]) {
                resources[locale] = { translation: {} };
            }

            if (fs.existsSync(path.join(dist, source, namespace, file))) {
                console.log('start exist');
            }
            console.log('start reading file', path.join(dist, source, namespace, file));
            const namespaceFile = fs.readFileSync(path.join(dist, source, namespace, file), 'utf8');
            console.log('end reading file');
            console.log(namespaceFile);
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
    writeFiles(resources, defaultResource);

    console.log('----------End Build Locales----------');
};

main().catch(() => process.exit(1));
