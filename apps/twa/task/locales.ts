import * as fs from 'fs';

console.log('Copy Locales');
const srcDir = `../../packages/locales/dist/locales`;
const devDestDir = `public/locales`;

fs.rmSync(devDestDir, { recursive: true, force: true });
fs.mkdirSync(devDestDir, { recursive: true });
fs.cpSync(srcDir, devDestDir, { recursive: true });
