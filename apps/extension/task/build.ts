import * as child_process from 'child_process';
import dotenv from 'dotenv';
import * as fs from 'fs-extra';
import chrome from './chrome';
import common from './common';
import firefox from './fireFox';

dotenv.config();

common.notify('Build UI');

common.exec('npx react-app-rewired build', {
    stdio: 'inherit',
    env: {
        ...process.env,
        INLINE_RUNTIME_CHUNK: false,
        REACT_APP_EXTENSION_TYPE: '%%%EXTENSION%%%'
    }
});

common.notify(`Build Tonkeeper background.js, provider.js, content.js`);

console.log({ key: process.env.REACT_APP_APTABASE, host: process.env.REACT_APP_APTABASE_HOST });

common.exec('npx webpack -c ./task/webpack.config.js', {
    stdio: 'inherit',
    env: process.env
});

common.notify('Copy Locales');

const srcDir = `../../packages/locales/dist/extension`;
const destDir = `build/_locales`;
fs.copySync(srcDir, destDir, { overwrite: true });

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

common.notify(`Create Chrome Build ${packageJson.version}`);

const buildDir = `build`;
const buildDirChrome = `dist/chrome`;
const buildDirFireFox = `dist/firefox`;

fs.rmSync('dist', { recursive: true, force: true });
fs.mkdirSync('dist');
fs.mkdirSync(buildDirChrome);
fs.mkdirSync(buildDirFireFox);

fs.copySync(buildDir, buildDirChrome);

chrome.updateChromeManifest(buildDirChrome, packageJson.version);
common.addEnvironmentVariable(buildDirChrome, '%%%EXTENSION%%%', 'Chrome');

child_process.execSync(
    `zip ../tonkeeper_chrome_v${packageJson.version}.zip -r ${buildDirChrome}/ *`,
    {
        cwd: `${buildDirChrome}/`
    }
);

common.updateApplicationName(
    buildDirChrome,
    'Tonkeeper BETA',
    'THIS EXTENSION IS FOR BETA TESTING'
);

child_process.execSync(
    `zip ../tonkeeper_chrome_beta_v${packageJson.version}.zip -r ${buildDirChrome}/ *`,
    {
        cwd: `${buildDirChrome}/`
    }
);

common.notify(`Create FireFox Build ${packageJson.version}`);

fs.copySync(buildDir, buildDirFireFox);

firefox.updateFireFoxManifest(buildDirFireFox, packageJson.version);
common.addEnvironmentVariable(buildDirFireFox, '%%%EXTENSION%%%', 'FireFox');

child_process.execSync(
    `zip ../tonkeeper_firefox_v${packageJson.version}.zip -r ${buildDirFireFox}/ *`,
    {
        cwd: `${buildDirFireFox}/`
    }
);

common.notify('End Build Extension');
