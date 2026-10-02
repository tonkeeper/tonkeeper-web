#!/usr/bin/env node
// Injects the version from RELEASE_TAG env var into all app package.json files.
// Runs in CI after checkout, before build — no git operations.

const fs = require('fs');
const path = require('path');

const tag = process.env.RELEASE_TAG || '';
const version = tag.replace(/^v/, '');

// Desktop auto-update uses update.electronjs.org, which only considers releases
// with valid SemVer tags. Numeric identifiers must not contain leading zeroes.
const semverRegexp = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

if (!semverRegexp.test(version)) {
    console.error(
        `Invalid or missing RELEASE_TAG: "${tag}". Expected valid SemVer, e.g. v1.2.3 or v1.2.3-rc.1. Do not use leading zeroes like v26.06.0.`
    );
    process.exit(1);
}

const root = path.resolve(__dirname, '..');
const targets = [
    root,
    ...['desktop', 'extension', 'web', 'mobile'].map(app => path.join(root, 'apps', app)),
];

for (const dir of targets) {
    const file = path.join(dir, 'package.json');
    if (!fs.existsSync(file)) continue;
    const pkg = JSON.parse(fs.readFileSync(file, 'utf8'));
    pkg.version = version;
    fs.writeFileSync(file, JSON.stringify(pkg, null, 4) + '\n');
    console.log(`${path.relative(root, file)}: ${version}`);
}
