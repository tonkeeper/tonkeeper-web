#!/usr/bin/env node
/* eslint-disable no-console */
// Run uikit component tests: the ones affected by the current change set by
// default, an explicit list of paths, or the whole suite with `--all`.
//
// Changed-set mapping (intentionally simple — a real dependency graph is
// overkill here):
//   - a changed `*.ct.tsx`            -> run it directly
//   - a changed `Foo.tsx` / `Foo.ts`  -> run colocated `Foo.ct.tsx` if it exists
//   - CT harness/config/shared styles -> run the whole component suite
//
// Compares against a base ref (default `origin/main`, override with BASE_REF)
// using a three-dot diff, plus any uncommitted working-tree changes so the
// script is useful locally too.
//
// Memory: Playwright CT bundles every test file of a run into ONE Vite/Rollup
// build (treeshake off), so the build's heap grows with the suite and
// eventually OOMs no matter how large --max-old-space-size is. Runs larger
// than CT_CHUNK_SIZE files (default 30) are therefore split into sequential
// `playwright test` invocations — each a fresh Node process bundling only its
// slice. The CT cache is cleared before each chunk: its metainfo.json merges
// previously-seen components back into the bundle, so a stale cache would make
// every chunk re-bundle the previous ones.
//
// Usage:
//   node scripts/test-changed-components.mjs                # changed only
//   node scripts/test-changed-components.mjs --all          # whole suite
//   node scripts/test-changed-components.mjs src/primitives # explicit paths
//   BASE_REF=origin/release node scripts/test-changed-components.mjs
//   CT_CHUNK_SIZE=20 node scripts/test-changed-components.mjs --all
//   node scripts/test-changed-components.mjs --all -- --update-snapshots
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, readdirSync, rmSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const uikitDir = join(repoRoot, 'packages', 'uikit');
const ctCacheDir = join(uikitDir, 'playwright', '.cache');
const UIKIT_PREFIX = 'packages/uikit/src/';
// Everything a mounted component renders through, so a change here can shift
// any screenshot and the whole suite runs.
//
// `playwright/` stays a whole-directory rule on purpose: the mount harness pulls
// its neighbours in (index.tsx imports the account fixture, which feeds the
// providers wrapping every test), so a new file there is global until proven
// otherwise. Exceptions must be listed explicitly below.
//
// `src/styles/` is not a directory rule — only the modules the harness actually
// imports are global. The harness derives every test mode from `defaultTheme`
// (see `themeForMode`), so the app-runtime themes (light/pro/mobilePro) and
// `tailwindBridge` never reach a mounted component. If the harness ever imports
// one of those, add it here.
const ALL_TESTS_PREFIXES = ['packages/uikit/playwright/'];
const ALL_TESTS_FILES = new Set([
    'packages/uikit/playwright-ct.config.ts',
    // Drives the postcss Tailwind plugin in the CT config: every utility class.
    'packages/uikit/tailwind.config.ts',
    'packages/uikit/src/styles/defaultTheme.ts',
    'packages/uikit/src/styles/globalStyle.ts',
    'packages/uikit/src/styles/tailwind.css'
]);
// Files under an ALL_TESTS_PREFIXES directory that cannot change any result.
const ALL_TESTS_EXCEPTIONS = new Set(['packages/uikit/playwright/terminalImageLinksReporter.ts']);
const CHUNK_SIZE = Math.max(1, Number(process.env.CT_CHUNK_SIZE) || 30);

const argv = process.argv.slice(2);
// Everything after a literal `--` is forwarded verbatim to `playwright test`.
const ownArgs = argv.includes('--') ? argv.slice(0, argv.indexOf('--')) : argv;
const passThrough = argv.includes('--') ? argv.slice(argv.indexOf('--') + 1) : [];
const runAll = ownArgs.includes('--all');
const pathArgs = ownArgs.filter(a => a !== '--all');

const git = (...args) =>
    execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' })
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

function changedFiles() {
    const baseRef = process.env.BASE_REF || 'origin/main';
    const files = new Set();
    let baseRefMissing = false;
    try {
        // Committed changes since the merge-base with the base ref.
        git('diff', '--name-only', `${baseRef}...HEAD`).forEach(f => files.add(f));
    } catch {
        baseRefMissing = true;
        console.warn(`[test-changed] base ref "${baseRef}" not found; using working tree only`);
    }
    // Uncommitted + staged changes.
    git('diff', '--name-only', 'HEAD').forEach(f => files.add(f));
    git('ls-files', '--others', '--exclude-standard').forEach(f => files.add(f));
    return { files: [...files], baseRefMissing };
}

function toTestFiles(files) {
    const tests = new Set();
    for (const file of files) {
        if (!file.startsWith(UIKIT_PREFIX)) continue;
        if (file.endsWith('.ct.tsx')) {
            if (existsSync(join(repoRoot, file))) tests.add(file);
            continue;
        }
        const sibling = file.replace(/\.(tsx?|ts)$/, '.ct.tsx');
        if (sibling !== file && existsSync(join(repoRoot, sibling))) tests.add(sibling);
    }
    // Paths relative to the uikit workspace, where playwright runs.
    return [...tests].map(f => f.slice('packages/uikit/'.length));
}

function affectsAllTests(file) {
    if (ALL_TESTS_EXCEPTIONS.has(file)) return false;
    return ALL_TESTS_FILES.has(file) || ALL_TESTS_PREFIXES.some(prefix => file.startsWith(prefix));
}

function collectCtFiles(dir) {
    const found = [];
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) found.push(...collectCtFiles(full));
        else if (entry.name.endsWith('.ct.tsx')) found.push(relative(uikitDir, full));
    }
    return found;
}

// Expand explicit path args (uikit-relative or repo-relative; files or
// directories) into concrete .ct.tsx files so large explicit runs chunk too.
// Returns null when an arg isn't a resolvable path (e.g. a title regex) — the
// caller then falls back to a single verbatim invocation.
function expandPathArgs(args) {
    const tests = new Set();
    for (const arg of args) {
        const rel = arg.startsWith('packages/uikit/') ? arg.slice('packages/uikit/'.length) : arg;
        const full = join(uikitDir, rel);
        if (!existsSync(full)) return null;
        if (statSync(full).isDirectory()) collectCtFiles(full).forEach(f => tests.add(f));
        else if (rel.endsWith('.ct.tsx')) tests.add(rel);
        else return null;
    }
    return [...tests];
}

// Streams playwright's output through while also capturing it, so failures can
// be classified (see runPlaywright).
function runPlaywrightOnce(args, extraEnv) {
    console.log(`[test-changed] playwright test ${args.join(' ')}`.trim());
    return new Promise((resolvePromise, reject) => {
        const child = spawn(
            'npx',
            ['playwright', 'test', '-c', 'playwright-ct.config.ts', ...args],
            {
                cwd: uikitDir,
                env: {
                    ...process.env,
                    NODE_OPTIONS: process.env.NODE_OPTIONS || '--max-old-space-size=8192',
                    ...extraEnv
                },
                stdio: ['inherit', 'pipe', 'pipe']
            }
        );
        let output = '';
        const capture = d => {
            output += d;
            // Only the tail is needed for failure classification.
            if (output.length > 1_000_000) output = output.slice(-500_000);
        };
        child.stdout.on('data', d => {
            capture(d);
            process.stdout.write(d);
        });
        child.stderr.on('data', d => {
            capture(d);
            process.stderr.write(d);
        });
        child.on('error', reject);
        child.on('close', code => resolvePromise({ status: code ?? 1, output }));
    });
}

// Docker bind mounts intermittently drop directories mid-run (the same glitch
// run-ct-docker.sh pre-creates src/components/layout for), which kills
// playwright's test-dir scan with ENOENT before any test executes. Retry once
// on that signature only — genuine test failures still fail on the first run.
async function runPlaywright(args, extraEnv = {}) {
    let result = await runPlaywrightOnce(args, extraEnv);
    if (result.status !== 0 && /ENOENT/.test(result.output)) {
        console.warn('[test-changed] run crashed with a transient ENOENT; retrying once.');
        result = await runPlaywrightOnce(args, extraEnv);
    }
    if (result.status !== 0) {
        throw Object.assign(new Error('playwright test failed'), { status: result.status });
    }
}

async function runChunked(testFiles) {
    if (testFiles.length <= CHUNK_SIZE) {
        await runPlaywright([...testFiles, ...passThrough]);
        return;
    }
    const chunks = [];
    const sorted = [...testFiles].sort();
    for (let i = 0; i < sorted.length; i += CHUNK_SIZE) {
        chunks.push(sorted.slice(i, i + CHUNK_SIZE));
    }
    console.log(
        `[test-changed] ${sorted.length} test files > CT_CHUNK_SIZE=${CHUNK_SIZE}; ` +
        `running ${chunks.length} chunks to bound the CT bundle's memory.`
    );
    const failedChunks = [];
    for (const [i, chunk] of chunks.entries()) {
        const label = `${i + 1}/${chunks.length}`;
        console.log(`[test-changed] chunk ${label} (${chunk.length} files)`);
        rmSync(ctCacheDir, { recursive: true, force: true });
        try {
            // Per-chunk HTML report dir, otherwise each chunk overwrites the last.
            await runPlaywright([...chunk, ...passThrough], {
                PLAYWRIGHT_HTML_REPORT: join('playwright-report', `chunk-${i + 1}`)
            });
        } catch (err) {
            if (err.status === undefined) throw err;
            failedChunks.push(label);
        }
    }
    if (failedChunks.length > 0) {
        console.error(`[test-changed] failed chunks: ${failedChunks.join(', ')}`);
        process.exit(1);
    }
}

try {
    if (runAll) {
        await runChunked(collectCtFiles(join(uikitDir, 'src')));
        process.exit(0);
    }

    if (pathArgs.length > 0) {
        const testFiles = expandPathArgs(pathArgs);
        if (testFiles === null || testFiles.length === 0) {
            // Non-path filter (regex, glob, …) or no matches: let playwright resolve it.
            await runPlaywright([...pathArgs, ...passThrough]);
        } else {
            await runChunked(testFiles);
        }
        process.exit(0);
    }

    const { files, baseRefMissing } = changedFiles();
    // Without the base ref the change set is only the working tree, which on CI
    // is empty — selecting nothing and passing. Run everything instead, so a
    // missing ref can never look like a green gate.
    if (baseRefMissing && process.env.CI) {
        console.log('[test-changed] base ref unavailable on CI; running all.');
        await runChunked(collectCtFiles(join(uikitDir, 'src')));
        process.exit(0);
    }

    const globalChanges = files.filter(affectsAllTests);
    if (globalChanges.length > 0) {
        console.log('[test-changed] shared component-test infrastructure changed; running all:');
        globalChanges.forEach(f => console.log(`  - ${f}`));
        await runChunked(collectCtFiles(join(uikitDir, 'src')));
        process.exit(0);
    }

    const testFiles = toTestFiles(files);
    if (testFiles.length === 0) {
        console.log('[test-changed] no component tests affected by the change set — skipping.');
        process.exit(0);
    }

    console.log(`[test-changed] ${testFiles.length} affected test file(s):`);
    testFiles.forEach(f => console.log(`  - ${f}`));
    await runChunked(testFiles);
} catch (err) {
    process.exit(err.status ?? 1);
}
