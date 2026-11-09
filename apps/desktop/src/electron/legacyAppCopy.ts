import { delay } from '@tonkeeper/core/dist/utils/common';
import { spawnSync } from 'child_process';
import { app, dialog, shell } from 'electron';
import log from 'electron-log/main';
import Store from 'electron-store';
import { existsSync, readFileSync } from 'fs';
import path from 'path';
import { translation } from './mainProcessLocale';
import { MainWindow } from './mainWindow';

// Installing Keeper.app by hand does not replace a Tonkeeper.app from before the rename. Both
// copies share one bundle id, one data folder and one keychain, so the old one is redundant.
const LEGACY_BUNDLE_NAME = 'Tonkeeper.app';

const store = new Store<{ dismissed?: boolean }>({ name: 'legacy-app-copy' });

const applicationsFolders = () => ['/Applications', path.join(app.getPath('home'), 'Applications')];

const readBundleId = (bundlePath: string) => {
    try {
        const plist = readFileSync(path.join(bundlePath, 'Contents', 'Info.plist'), 'utf8');
        return /<key>CFBundleIdentifier<\/key>\s*<string>([^<]+)<\/string>/.exec(plist)?.[1];
    } catch {
        return undefined;
    }
};

// Builds from before the rename never take the single-instance lock, so a copy of one can be
// running next to this app and write to the same data folder.
const findOtherRunningCopies = (bundleId: string, ownBundle: string) => {
    const ps = spawnSync('ps', ['-axo', 'pid=,comm='], { encoding: 'utf8' });
    if (ps.status !== 0) return [];

    return ps.stdout.split('\n').flatMap(line => {
        const match = /^\s*(\d+)\s+(.+\.app)\/Contents\/MacOS\/[^/]+$/.exec(line);
        if (!match) return [];
        const [, pid, bundle] = match;
        return bundle !== ownBundle && readBundleId(bundle) === bundleId ? [Number(pid)] : [];
    });
};

const waitForExit = async (pid: number) => {
    for (let attempt = 0; attempt < 50; attempt++) {
        try {
            process.kill(pid, 0);
        } catch {
            return;
        }
        await delay(100);
    }
    log.warn('legacy app copy: still running', pid);
};

const closeOtherRunningCopies = async (bundleId: string, ownBundle: string) => {
    const pids = findOtherRunningCopies(bundleId, ownBundle);
    if (pids.length === 0) return true;

    const window = await MainWindow.openMainWindow();
    const { response } = await dialog.showMessageBox(window, {
        type: 'info',
        message: translation.desktop_legacy_app_running_title,
        detail: translation.desktop_legacy_app_running_description,
        buttons: [
            translation.desktop_legacy_app_running_quit_old,
            translation.desktop_legacy_app_running_quit_this
        ],
        defaultId: 0,
        cancelId: 1
    });

    if (response !== 0) {
        app.quit();
        return false;
    }

    for (const pid of pids) {
        try {
            process.kill(pid, 'SIGTERM');
        } catch (e) {
            log.error('legacy app copy: quit failed', e);
        }
    }
    await Promise.all(pids.map(waitForExit));
    return true;
};

const offerLegacyCopyRemoval = async (bundleId: string, ownBundle: string) => {
    if (store.get('dismissed')) return;

    // A copy started from the DMG or from a translocated download is not installed yet; trashing
    // the installed app then would leave the user without one.
    if (!applicationsFolders().includes(path.dirname(ownBundle))) return;
    if (path.basename(ownBundle) === LEGACY_BUNDLE_NAME) return;

    const copies = applicationsFolders()
        .map(folder => path.join(folder, LEGACY_BUNDLE_NAME))
        .filter(candidate => existsSync(candidate) && readBundleId(candidate) === bundleId);
    if (copies.length === 0) return;

    const window = await MainWindow.openMainWindow();
    const { response } = await dialog.showMessageBox(window, {
        type: 'question',
        message: translation.desktop_legacy_app_title,
        detail: translation.desktop_legacy_app_description,
        buttons: [translation.desktop_legacy_app_trash, translation.desktop_legacy_app_keep],
        defaultId: 0,
        cancelId: 1
    });

    if (response !== 0) {
        store.set('dismissed', true);
        return;
    }

    for (const copy of copies) {
        try {
            await shell.trashItem(copy);
        } catch (e) {
            log.error('legacy app copy: trash failed', e);
            shell.showItemInFolder(copy);
        }
    }
};

export const settleLegacyAppCopies = async () => {
    if (!app.isPackaged || !app.hasSingleInstanceLock()) return;
    // A copy started with its own data folder shares nothing with the installed one.
    if (app.commandLine.hasSwitch('user-data-dir')) return;

    const ownBundle = path.resolve(app.getPath('exe'), '..', '..', '..');
    const bundleId = readBundleId(ownBundle);
    if (!bundleId) return;

    if (!(await closeOtherRunningCopies(bundleId, ownBundle))) return;
    await offerLegacyCopyRemoval(bundleId, ownBundle);
};
