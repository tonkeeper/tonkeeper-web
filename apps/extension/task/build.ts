import dotenv from 'dotenv';
import { buildChrome } from './chrome';
import { buildFirefox } from './fireFox';
import { BUILD_BASE_PATH, notify } from './extension-builder';
import fs from 'fs-extra';

dotenv.config();

async function runBuild() {
    notify('Build UI and Extension Scripts');

    fs.rmSync(BUILD_BASE_PATH, { recursive: true, force: true });
    fs.mkdirSync(BUILD_BASE_PATH);

    await buildChrome();
    await buildFirefox();

    notify('End Build Extension');
}

runBuild();
