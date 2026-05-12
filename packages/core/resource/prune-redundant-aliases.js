#!/usr/bin/env node
/*
 * openapi-typescript-codegen emits two files per event:
 *   - XxxSchema.ts (the real type)
 *   - Xxx.ts      (a 1:1 alias: `export type Xxx = XxxSchema`)
 *
 * Our wrapper imports the Schema types directly and nothing inside generated/
 * uses the bare alias names, so the alias files are dead weight. Delete them
 * and strip their re-exports from generated/index.ts.
 *
 * Usage: prune-redundant-aliases.js <generated-dir>
 */
const fs = require('fs');
const path = require('path');

const [, , GEN_DIR] = process.argv;
if (!GEN_DIR) {
    console.error('usage: prune-redundant-aliases.js <generated-dir>');
    process.exit(1);
}

const modelsDir = path.join(GEN_DIR, 'models');
const indexFile = path.join(GEN_DIR, 'index.ts');

// A redundant alias file matches exactly:
//   /* ...generated banner (4 lines)... */
//   import type { <Target> } from './<Target>';
//   export type <Alias> = <Target>;
// where <Alias> equals the filename. We don't require <Alias> === <Target>
// because upstream sometimes uses different casing (e.g. InappReview vs
// InAppReviewSchema).
const ALIAS_RE = new RegExp(
    String.raw`^/\* generated using openapi-typescript-codegen -- do not edit \*/\s*` +
        String.raw`/\* istanbul ignore file \*/\s*` +
        String.raw`/\* tslint:disable \*/\s*` +
        String.raw`/\* eslint-disable \*/\s*` +
        String.raw`import type \{ (\w+) \} from '\./\1';\s*` +
        String.raw`export type (\w+) = \1;\s*$`
);

const pruned = [];
for (const file of fs.readdirSync(modelsDir).sort()) {
    if (!file.endsWith('.ts') || file.endsWith('Schema.ts')) continue;
    const name = file.replace(/\.ts$/, '');
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8').trim();
    const match = content.match(ALIAS_RE);
    if (match && match[2] === name) {
        fs.unlinkSync(filePath);
        pruned.push(name);
    }
}

if (pruned.length) {
    const lines = fs.readFileSync(indexFile, 'utf8').split('\n');
    const dropped = new Set(
        pruned.map(name => `export type { ${name} } from './models/${name}';`)
    );
    const kept = lines.filter(line => !dropped.has(line));
    fs.writeFileSync(indexFile, kept.join('\n'));
}

console.log(`prune: removed ${pruned.length} redundant alias files`);
