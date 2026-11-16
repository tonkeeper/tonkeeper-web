import { spawn } from 'child_process';
import { app } from 'electron';
import log from 'electron-log/main';
import {
    accessSync,
    constants,
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'fs';
import path from 'path';

// Squirrel.Mac installs an update in place, so an install from before the rename stays
// Tonkeeper.app. Squirrel can rename the bundle itself, but it then fails to relaunch the app, so
// the app moves to Keeper.app on its own first start instead.
const LEGACY_BUNDLE_NAME = 'Tonkeeper.app';
const BUNDLE_NAME = 'Keeper.app';

// Set on the relaunch after a failed rename. Without it the old bundle would start the move again
// and the app would open and close in a loop.
const MOVE_FAILED_SWITCH = 'keeper-bundle-move-failed';

// Renaming the bundle of a running process leaves a dead Tonkeeper tile in the Dock, so the rename
// waits for this process to exit. If the rename fails (macOS App Management can refuse it), the old
// bundle opens again with MOVE_FAILED_SWITCH and the reason in $4.
const RENAME_AND_REOPEN = `
while kill -0 "$1" 2>/dev/null; do sleep 0.1; done
if mv "$2" "$3" 2>"$4"; then open "$3"; else open "$2" --args --${MOVE_FAILED_SWITCH}; fi
`;

const applicationsFolders = () => ['/Applications', path.join(app.getPath('home'), 'Applications')];

const failedMarker = () => path.join(app.getPath('userData'), 'keeper-bundle-move-failed');
const errorFile = () => path.join(app.getPath('userData'), 'keeper-bundle-move-error.txt');

// One failed rename is final: the user can still rename the app in Finder.
const recordFailedMove = () => {
    let reason = '';
    try {
        reason = readFileSync(errorFile(), 'utf8').trim();
        rmSync(errorFile(), { force: true });
    } catch {
        // No reason was written.
    }
    log.warn('moving the app to Keeper.app failed', reason);
    try {
        writeFileSync(failedMarker(), reason || 'failed');
    } catch (e) {
        log.error('keeper bundle move: marker not written', e);
    }
};

/**
 * Starts the move of a Tonkeeper.app install to Keeper.app. Returns true when the move started and
 * this process has to exit right away; the app then opens again from the new bundle.
 */
export const startKeeperBundleMove = () => {
    if (process.platform !== 'darwin' || !app.isPackaged) return false;
    // A copy started with its own data folder is a test or QA run, not the installed app.
    if (app.commandLine.hasSwitch('user-data-dir')) return false;

    if (app.commandLine.hasSwitch(MOVE_FAILED_SWITCH)) {
        recordFailedMove();
        return false;
    }
    if (existsSync(failedMarker())) return false;

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
        // The shell writes the rename error here; a redirect into a missing folder would skip the
        // rename altogether.
        mkdirSync(app.getPath('userData'), { recursive: true });
        spawn(
            '/bin/sh',
            [
                '-c',
                RENAME_AND_REOPEN,
                'keeper-bundle-move',
                String(process.pid),
                ownBundle,
                target,
                errorFile()
            ],
            { detached: true, stdio: 'ignore' }
        ).unref();
    } catch {
        return false;
    }
    return true;
};
