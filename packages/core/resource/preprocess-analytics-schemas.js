#!/usr/bin/env node
/*
 * Workaround for broken local $refs in tonkeeper/analytics-schemas (openapi-client/).
 *
 * The upstream `analytics.yaml` aliases cross-file schemas at the top level
 * (e.g. `RampSource: $ref: ./ramps-common.yaml#/.../RampSourceSchema`), but
 * individual per-domain files like `deposit-flow.yaml` reference those aliases
 * as if they were local (`$ref: '#/components/schemas/RampSource'`). OpenAPI
 * resolves `#/...` refs relative to the file that contains them, so bundlers
 * fail with "Token X does not exist".
 *
 * This script copies each schema yaml from <src> to <dst> and appends every
 * top-level alias from `analytics.yaml` to its `components.schemas` block, so
 * the broken local refs resolve to the intended cross-file targets. Once
 * upstream stops aliasing at the top level (and uses direct cross-file refs in
 * every domain file), this preprocessor becomes a no-op and can be removed.
 *
 * Usage: preprocess-analytics-schemas.js <src-openapi-dir> <dst-openapi-dir>
 */
const fs = require('fs');
const path = require('path');

const [, , SRC, DST] = process.argv;

if (!SRC || !DST) {
    console.error(
        'usage: preprocess-analytics-schemas.js <src-openapi-dir> <dst-openapi-dir>'
    );
    process.exit(1);
}

fs.mkdirSync(DST, { recursive: true });

const indexYaml = fs.readFileSync(path.join(SRC, 'analytics.yaml'), 'utf8');

// Match top-level alias entries under `  schemas:` (4-space indent), shaped as:
//     <Name>:
//       $ref: "<ref>"
const aliasRe = /^ {4}([A-Za-z][A-Za-z0-9]*):\n {6}\$ref:\s*["']([^"']+)["']/gm;
const aliases = [];
let m;
while ((m = aliasRe.exec(indexYaml)) !== null) {
    aliases.push({ name: m[1], ref: m[2] });
}

if (aliases.length === 0) {
    console.error('preprocess: no aliases parsed from analytics.yaml');
    process.exit(1);
}

// Match top-level schema definitions to detect names that would clash with
// alias injection (4-space indent, name followed by colon, NOT a $ref-only
// alias entry — anything with a body counts).
const existingSchemaRe = /^ {4}([A-Za-z][A-Za-z0-9]*):\s*$/gm;

let patched = 0;
for (const file of fs.readdirSync(SRC)) {
    const srcPath = path.join(SRC, file);
    const dstPath = path.join(DST, file);

    if (!file.endsWith('.yaml') || file === 'analytics.yaml') {
        fs.copyFileSync(srcPath, dstPath);
        continue;
    }

    let content = fs.readFileSync(srcPath, 'utf8');
    if (!content.includes('components:')) {
        fs.copyFileSync(srcPath, dstPath);
        continue;
    }

    const existing = new Set();
    let em;
    existingSchemaRe.lastIndex = 0;
    while ((em = existingSchemaRe.exec(content)) !== null) {
        existing.add(em[1]);
    }

    const aliasBlock = aliases
        .filter(a => !existing.has(a.name))
        .map(a => `    ${a.name}:\n      $ref: '${a.ref}'`)
        .join('\n');

    if (!aliasBlock) {
        fs.copyFileSync(srcPath, dstPath);
        continue;
    }

    if (!content.endsWith('\n')) content += '\n';
    content += aliasBlock + '\n';
    fs.writeFileSync(dstPath, content);
    patched += 1;
}

console.log(
    `preprocess: injected up to ${aliases.length} aliases into ${patched} schema files`
);
