import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const REPO_ROOT = path.resolve(__dirname, '../../..');
const LOCALES_SRC = path.resolve(__dirname, '../src');

const NAMESPACES = ['tonkeeper', 'tonkeeper-web'];

const SOURCE_DIRS = [
    'packages/uikit/src',
    'packages/core/src',
    'apps/web/src',
    'apps/desktop/src',
    'apps/extension/src',
    'apps/extension/public',
    'apps/mobile/src',
    'apps/twa/src'
];

const SOURCE_GLOBS = ["-name '*.ts'", "-o -name '*.tsx'", "-o -name 'manifest.json'"];

// i18next resolves t('foo', { count }) to foo_one / foo_few / foo_many / foo_other / foo_two / foo_zero
const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;
const PLURAL_FORMS = ['_zero', '_one', '_two', '_few', '_many', '_other'];

const UNUSED_PREFIX = 'unused_';

// Mirrors toDict() in build.ts — flattens nested objects, joining keys with `_`
// (and replacing `.` / `-` to match the runtime key shape).
const flatten = (parent: string | undefined, value: object): Record<string, string> => {
    return Object.entries(value).reduce((acc, [rawKey, message]) => {
        const key = rawKey.replace(/\./g, '_').replace(/-/g, '_');
        const itemKey = parent ? `${parent}_${key}` : key;
        if (typeof message === 'string') {
            acc[itemKey] = message;
        } else {
            Object.assign(acc, flatten(itemKey, message as object));
        }
        return acc;
    }, {} as Record<string, string>);
};

const loadLocaleKeys = (locale: string): Set<string> => {
    const keys = new Set<string>();
    for (const ns of NAMESPACES) {
        const file = path.join(LOCALES_SRC, ns, `${locale}.json`);
        if (!fs.existsSync(file)) continue;
        const json = JSON.parse(fs.readFileSync(file, 'utf8'));
        for (const k of Object.keys(flatten(undefined, json))) keys.add(k);
    }
    return keys;
};

const listLocales = (): string[] => {
    const locales = new Set<string>();
    for (const ns of NAMESPACES) {
        const dir = path.join(LOCALES_SRC, ns);
        if (!fs.existsSync(dir)) continue;
        for (const f of fs.readdirSync(dir)) {
            if (f.endsWith('.json')) locales.add(f.replace(/\.json$/, ''));
        }
    }
    return Array.from(locales).sort();
};

const loadSourceBlob = (): { blob: string; fileCount: number } => {
    const dirs = SOURCE_DIRS.map(p => path.join(REPO_ROOT, p)).filter(p => fs.existsSync(p));
    const list = execSync(`find ${dirs.join(' ')} -type f \\( ${SOURCE_GLOBS.join(' ')} \\)`, {
        encoding: 'utf8',
        maxBuffer: 100 * 1024 * 1024
    })
        .trim()
        .split('\n');
    let blob = '';
    for (const f of list) {
        try {
            blob += fs.readFileSync(f, 'utf8') + '\n';
        } catch {
            /* ignore */
        }
    }
    return { blob, fileCount: list.length };
};

const extractReferences = (blob: string): { keys: Set<string>; prefixes: string[] } => {
    const keys = new Set<string>();
    const prefixes = new Set<string>();
    let m: RegExpExecArray | null;

    // t('foo') / t("foo") / t(`foo`) — full literal arg (followed by `,` or `)`)
    const tFullRe = /\bt\(\s*['"`]([a-zA-Z_][a-zA-Z0-9_]*)['"`]\s*[,)]/g;
    while ((m = tFullRe.exec(blob)) !== null) keys.add(m[1]);

    // dist.translation.foo — Electron menu accesses keys as object properties
    const dotAccessRe = /\.translation\.([a-zA-Z_][a-zA-Z0-9_]*)/g;
    while ((m = dotAccessRe.exec(blob)) !== null) keys.add(m[1]);

    // __MSG_foo__ — Chrome extension manifest placeholder syntax
    const msgRe = /__MSG_([a-zA-Z_][a-zA-Z0-9_]*)__/g;
    while ((m = msgRe.exec(blob)) !== null) keys.add(m[1]);

    // Dynamic-key prefix patterns. Anything starting with these prefixes counts as referenced.
    // t('prefix_' + var) / t("prefix_" + var)
    const concatRe = /\bt\(\s*['"]([a-zA-Z_][a-zA-Z0-9_]*_)['"]\s*\+/g;
    while ((m = concatRe.exec(blob)) !== null) prefixes.add(m[1]);
    // t(`prefix_${var}...`)
    const templateRe = /\bt\(\s*`([a-zA-Z_][a-zA-Z0-9_]*_)\$\{/g;
    while ((m = templateRe.exec(blob)) !== null) prefixes.add(m[1]);

    return { keys, prefixes: Array.from(prefixes) };
};

const isKeyReferenced = (key: string, refs: Set<string>, prefixes: string[]): boolean => {
    if (refs.has(key)) return true;
    if (PLURAL_SUFFIX.test(key)) {
        const base = key.replace(PLURAL_SUFFIX, '');
        if (refs.has(base)) return true;
    }
    for (const p of prefixes) {
        if (key.startsWith(p)) return true;
    }
    return false;
};

const isRefDefined = (ref: string, enKeys: Set<string>): boolean => {
    if (enKeys.has(ref)) return true;
    for (const suf of PLURAL_FORMS) {
        if (enKeys.has(ref + suf)) return true;
    }
    return false;
};

const formatList = (items: string[], limit = Infinity): string => {
    const shown = items.slice(0, limit);
    const lines = shown.map(s => `    - ${s}`);
    if (items.length > shown.length) {
        lines.push(`    ... (${items.length - shown.length} more)`);
    }
    return lines.join('\n');
};

const main = () => {
    const args = process.argv.slice(2);
    const strictLocales = args.includes('--strict-locales');
    const showAll = args.includes('--all');

    const enKeys = loadLocaleKeys('en');
    if (enKeys.size === 0) {
        console.error(
            `No EN keys found in ${LOCALES_SRC}. Did Tolgee sync run? Try: yarn workspace @tonkeeper/locales build`
        );
        process.exit(1);
    }

    const { blob, fileCount } = loadSourceBlob();
    const { keys: refs, prefixes } = extractReferences(blob);

    const enKeysArr = Array.from(enKeys);
    const allDead = enKeysArr.filter(k => !isKeyReferenced(k, refs, prefixes)).sort();
    const deadPrefixed = allDead.filter(k => k.startsWith(UNUSED_PREFIX));
    const deadUnprefixed = allDead.filter(k => !k.startsWith(UNUSED_PREFIX));

    const missing = Array.from(refs)
        .filter(r => !isRefDefined(r, enKeys))
        .sort();

    const locales = listLocales().filter(l => l !== 'en');
    const localeGaps: { locale: string; missing: string[] }[] = [];
    for (const locale of locales) {
        const localeKeys = loadLocaleKeys(locale);
        const gap = enKeysArr
            .filter(k => !localeKeys.has(k) && !k.startsWith(UNUSED_PREFIX))
            .sort();
        if (gap.length > 0) localeGaps.push({ locale, missing: gap });
    }

    console.log('=== i18n lint ===\n');
    console.log(`EN keys total:        ${enKeys.size}`);
    console.log(`Source files scanned: ${fileCount}`);
    console.log(`Referenced in source: ${refs.size}\n`);

    console.log(
        `[1] Dead keys: ${allDead.length}  (${deadPrefixed.length} prefixed ${UNUSED_PREFIX}, ${deadUnprefixed.length} unprefixed)`
    );
    if (deadUnprefixed.length > 0) {
        console.log(formatList(deadUnprefixed, showAll ? Infinity : 50));
    }

    console.log(`\n[2] Missing references (in source, not in EN): ${missing.length}`);
    if (missing.length > 0) {
        console.log(formatList(missing, showAll ? Infinity : 50));
    }

    console.log(`\n[3] Locale gaps: ${localeGaps.length} locale(s) with missing keys`);
    for (const { locale, missing: keys } of localeGaps) {
        console.log(`  ${locale}: ${keys.length} missing`);
        console.log(formatList(keys, showAll ? Infinity : 5).replace(/^ {4}/gm, '      '));
    }

    const failures: string[] = [];
    if (deadUnprefixed.length > 0) {
        failures.push(
            `${deadUnprefixed.length} unprefixed dead key(s). Either rename them to "${UNUSED_PREFIX}*" in Tolgee or remove the corresponding t() callers.`
        );
    }
    if (missing.length > 0) {
        failures.push(
            `${missing.length} source reference(s) to keys missing from EN. Add the keys in Tolgee or remove the t() call.`
        );
    }
    if (strictLocales && localeGaps.length > 0) {
        failures.push(`${localeGaps.length} locale(s) have missing keys (--strict-locales).`);
    }

    console.log();
    if (failures.length > 0) {
        console.log('FAIL:');
        for (const f of failures) console.log(`  - ${f}`);
        process.exit(1);
    }
    console.log('OK');
};

main();
