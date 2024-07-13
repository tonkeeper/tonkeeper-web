import * as fs from 'fs-extra';

console.log('Copy Locales');
const srcDir = `../../packages/locales/dist/locales`;
const devDestDir = `public/locales`;

fs.rmSync(devDestDir, { recursive: true, force: true });
if (!fs.existsSync(devDestDir)) {
    fs.mkdirSync(devDestDir);
}
fs.copySync(srcDir, devDestDir, { overwrite: true });
