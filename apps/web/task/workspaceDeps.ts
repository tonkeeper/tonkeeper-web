import { existsSync, readFileSync, readdirSync } from 'fs';
import { builtinModules } from 'module';
import * as path from 'path';

const IMPORT_SPECIFIER = /\b(?:from|import|require)\s*\(?\s*['"]([^'"]+)['"]/g;

const NODE_BUILTINS = new Set([...builtinModules, ...builtinModules.map(m => `node:${m}`)]);

/**
 * Workspace packages served as source instead of being pre-bundled, so their own
 * imports never reach the optimizer as dependencies.
 */
const SOURCE_SERVED_PACKAGES = ['@tonkeeper/core', '@tonkeeper/uikit', '@tonkeeper/locales'];

/** Reachable only from test files, which the dev server never serves. */
const TEST_ONLY = new Set(['vitest']);

const packageRoot = (specifier: string) =>
    specifier.startsWith('@') ? specifier.split('/', 2).join('/') : specifier.split('/', 1)[0];

const collectJsFiles = (dir: string, out: string[] = []) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            collectJsFiles(full, out);
        } else if (entry.name.endsWith('.js')) {
            out.push(full);
        }
    }
    return out;
};

const bareSpecifiersIn = (dir: string) => {
    const specifiers = new Set<string>();

    for (const file of collectJsFiles(dir)) {
        const source = readFileSync(file, 'utf-8');
        for (const [, specifier] of source.matchAll(IMPORT_SPECIFIER)) {
            if (!specifier.startsWith('.') && !path.isAbsolute(specifier)) {
                specifiers.add(specifier);
            }
        }
    }

    return specifiers;
};

/**
 * Third-party specifiers imported by the compiled workspace packages, written in
 * Vite's nested `parent > dep` form for `optimizeDeps.include`.
 *
 * Those packages sit in `optimizeDeps.exclude`, so Vite crawls them as source.
 * Anything they reach only through a dynamic `import()` therefore stays
 * invisible until the route that needs it is opened — at which point the
 * optimizer picks up a new dependency and full-reloads the page. The reload
 * re-enters the app at the start route, opens the next lazy chunk, and the cycle
 * repeats, so the dev server appears to reload endlessly. Declaring the
 * specifiers up front moves that discovery into the cold start.
 *
 * The nested form matters: these deps live in the workspace package's own
 * `node_modules`, which is not reachable from the app root Vite resolves plain
 * include entries against.
 *
 * @param aliased package roots the app remaps in `resolve.alias`, skipped so a
 * second copy from a workspace package's `node_modules` can't get pre-bundled
 * alongside the app's — for React and friends that would mean two runtimes.
 */
export const workspaceDepsToPrebundle = (
    repoRoot: string,
    appRoot: string,
    aliased: string[]
): string[] => {
    const include: string[] = [];

    for (const name of SOURCE_SERVED_PACKAGES) {
        const packageDir = path.join(repoRoot, 'packages', name.replace('@tonkeeper/', ''));
        const dist = path.join(packageDir, 'dist');
        if (!existsSync(dist)) continue;

        const nodeModulesDirs = [
            path.join(packageDir, 'node_modules'),
            path.join(appRoot, 'node_modules'),
            path.join(repoRoot, 'node_modules')
        ];

        for (const specifier of bareSpecifiersIn(dist)) {
            const root = packageRoot(specifier);

            if (NODE_BUILTINS.has(root) || TEST_ONLY.has(root)) continue;
            if (SOURCE_SERVED_PACKAGES.includes(root) || aliased.includes(root)) continue;
            if (!nodeModulesDirs.some(dir => existsSync(path.join(dir, root)))) continue;

            include.push(`${name} > ${specifier}`);
        }
    }

    return include.sort();
};
