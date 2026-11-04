import * as fs from 'fs-extra';
import * as path from 'path';

console.log('Copy Locales');
const srcDir = `../../packages/locales/dist/locales`;
const buildDestDir = `dist/locales`;
const devDestDir = `public/locales`;
const retries = 5;
const retryDelayMs = 250;

const sleep = (ms: number) => {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
};

const copyLocales = (destDir: string) => {
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            fs.rmSync(destDir, { recursive: true, force: true });
            fs.mkdirSync(destDir, { recursive: true });
            fs.copySync(srcDir, destDir, { overwrite: true });
            return;
        } catch (e) {
            if (attempt === retries) {
                throw e;
            }

            sleep(retryDelayMs);
        }
    }
};

console.log(path.resolve(srcDir));
fs.readdirSync(srcDir).forEach(file => console.log(file));

if (!fs.existsSync('build')) {
    fs.mkdirSync('build');
}
copyLocales(buildDestDir);
copyLocales(devDestDir);
