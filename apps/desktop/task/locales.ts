import fs from 'fs-extra';

console.log('Copy Locales');
const srcDir = `../../packages/locales/dist/locales`;
const buildDestDir = `build/locales`;
const devDestDir = `public/locales`;

if (!fs.existsSync('build')) {
  fs.mkdirSync('build');
}
if (!fs.existsSync(buildDestDir)) {
  fs.mkdirSync(buildDestDir);
}
fs.rmSync(devDestDir, { recursive: true, force: true });
if (!fs.existsSync(devDestDir)) {
  fs.mkdirSync(devDestDir);
}
fs.copySync(srcDir, buildDestDir, { overwrite: true });
fs.copySync(srcDir, devDestDir, { overwrite: true });
