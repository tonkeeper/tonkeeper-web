// The version an app build reports to the backends, which gate features on it.
//
// Release builds carry the tag `set-version.js` stamps into package.json. Every other
// build (PR previews, staging, local) still has the committed `0.0.0`, which sorts below
// every feature gate, so it reports `9<yy>.<m>.0` for the build month instead: the same
// 9-prefix native dev builds use, sorting above every real release. No leading zeroes —
// the desktop updater needs valid SemVer and the extension manifest plain integers.

const fs = require('fs');
const path = require('path');

const UNSTAMPED_VERSION = '0.0.0';

/**
 * @param {string} packageVersion
 * @param {Date} [buildDate]
 * @returns {string}
 */
function resolveAppVersion(packageVersion, buildDate = new Date()) {
    if (packageVersion !== UNSTAMPED_VERSION) {
        return packageVersion;
    }
    const year = buildDate.getUTCFullYear() % 100;
    return `9${year}.${buildDate.getUTCMonth() + 1}.0`;
}

/**
 * @param {string} appDir directory holding the app's package.json
 * @returns {string}
 */
function readAppVersion(appDir) {
    const packageJson = JSON.parse(fs.readFileSync(path.join(appDir, 'package.json'), 'utf8'));
    return resolveAppVersion(packageJson.version);
}

module.exports = { resolveAppVersion, readAppVersion };
