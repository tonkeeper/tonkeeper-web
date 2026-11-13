import { spawn } from 'child_process';
import { app } from 'electron';
import { accessSync, constants, existsSync } from 'fs';
import path from 'path';

// Squirrel.Mac installs an update in place, so an install from before the rename stays
// Tonkeeper.app. Squirrel can rename the bundle itself, but it then fails to relaunch the app, so
// the app moves to Keeper.app on its own first start instead.
const LEGACY_BUNDLE_NAME = 'Tonkeeper.app';
const BUNDLE_NAME = 'Keeper.app';

// Renaming the bundle of a running process leaves a dead Tonkeeper tile in the Dock, so the rename
// waits for this process to exit. If the rename fails, the old bundle opens again.
const RENAME_AND_REOPEN = `
while kill -0 "$1" 2>/dev/null; do sleep 0.1; done
if mv "$2" "$3"; then open "$3"; else open "$2"; fi
`;

const applicationsFolders = () => ['/Applications', path.join(app.getPath('home'), 'Applications')];

/**
 * Starts the move of a Tonkeeper.app install to Keeper.app. Returns true when the move started and
 * this process has to exit right away; the app then opens again from the new bundle.
 */
export const startKeeperBundleMove = () => {
    if (process.platform !== 'darwin' || !app.isPackaged) return false;
    // A copy started with its own data folder is a test or QA run, not the installed app.
    if (app.commandLine.hasSwitch('user-data-dir')) return false;

    const ownBundle = path.resolve(app.getPath('exe'), '..', '..', '..');
    if (path.basename(ownBundle) !== LEGACY_BUNDLE_NAME) return false;

    const folder = path.dirname(ownBundle);
    // A copy started from the DMG or from a translocated download is not installed yet.
    if (!applicationsFolders().includes(folder)) return false;

    const target = path.join(folder, BUNDLE_NAME);
    if (existsSync(target)) return false;

    try {
        accessSync(folder, constants.W_OK);
    } catch {
        return false;
    }

    try {
        spawn(
            '/bin/sh',
            ['-c', RENAME_AND_REOPEN, 'keeper-bundle-move', String(process.pid), ownBundle, target],
            { detached: true, stdio: 'ignore' }
        ).unref();
    } catch {
        return false;
    }
    return true;
};
