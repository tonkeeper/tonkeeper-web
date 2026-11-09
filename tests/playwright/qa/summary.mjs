#!/usr/bin/env node
// Compact view of a QA run for an agent: one line per test, the first error line, evidence paths.
// Usage: node tests/playwright/qa/summary.mjs <TICKET>
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
const commonDir = execSync('git rev-parse --git-common-dir', { cwd: here }).toString().trim();
const qaHome = path.join(path.resolve(here, commonDir, '..'), 'tests', 'playwright', 'qa');
const ticket = process.argv[2] ?? 'adhoc';
const file = path.join(qaHome, 'out', ticket, 'run', 'results.json');

if (!fs.existsSync(file)) {
    console.log(`NO RESULTS: ${file}`);
    process.exit(1);
}

const { suites = [], stats = {} } = JSON.parse(fs.readFileSync(file, 'utf8'));
const rows = [];
const walk = (suite, project) => {
    for (const spec of suite.specs ?? []) {
        for (const t of spec.tests ?? []) {
            const r = t.results?.at(-1) ?? {};
            const firstError = (r.error?.message ?? '').split('\n').find(Boolean)?.slice(0, 200);
            const evidence = (r.attachments ?? [])
                .filter(a => a.path)
                .map(a => `${a.name}=${a.path}`);
            const errors = (r.attachments ?? []).filter(a => a.name.startsWith('errors-')).length;
            rows.push({
                project: t.projectName ?? project,
                title: spec.title,
                status: r.status,
                ms: r.duration,
                firstError,
                evidence,
                errors
            });
        }
    }
    for (const child of suite.suites ?? []) walk(child, project);
};
suites.forEach(s => walk(s));

console.log(
    `RUN ${ticket}: expected=${stats.expected ?? 0} unexpected=${stats.unexpected ?? 0} skipped=${
        stats.skipped ?? 0
    } flaky=${stats.flaky ?? 0}`
);
for (const r of rows) {
    console.log(
        `${(r.status ?? '?').toUpperCase().padEnd(8)} [${r.project}] ${r.title} (${Math.round(
            (r.ms ?? 0) / 1000
        )}s)${r.errors ? ' +page-errors' : ''}`
    );
    if (r.firstError) console.log(`         error: ${r.firstError}`);
    for (const e of r.evidence) console.log(`         ${e}`);
}
