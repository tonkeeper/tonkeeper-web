import { spawn, spawnSync } from 'child_process';
import { app, shell } from 'electron';
import { copyFileSync, existsSync, readdirSync, unlinkSync } from 'fs';
import path from 'path';

// Squirrel names shortcuts after the executable's ProductName. Installs from before the rename have
// shortcuts under the old name, and creating the new ones does not remove them.
const LEGACY_SHORTCUT = 'Tonkeeper.lnk';

const sameFile = (a: string, b: string) =>
    path.resolve(a).toLowerCase() === path.resolve(b).toLowerCase();

const removeLegacyShortcuts = (stubPath: string) => {
    const programs = path.join(
        app.getPath('appData'),
        'Microsoft',
        'Windows',
        'Start Menu',
        'Programs'
    );
    const folders = [app.getPath('desktop'), programs];
    try {
        for (const entry of readdirSync(programs, { withFileTypes: true })) {
            if (entry.isDirectory()) folders.push(path.join(programs, entry.name));
        }
    } catch {
        // No Start menu folder: nothing to look through there.
    }

    for (const folder of folders) {
        const shortcut = path.join(folder, LEGACY_SHORTCUT);
        try {
            if (!existsSync(shortcut)) continue;
            if (!sameFile(shell.readShortcutLink(shortcut).target, stubPath)) continue;
            unlinkSync(shortcut);
        } catch {
            // A shortcut that cannot be read or removed stays; the new one is still created.
        }
    }
};

// Update.exe downloads the Apps & features icon only when app.ico is missing, so an install keeps the
// icon from the version it was first installed with.
const refreshUninstallIcon = (rootDir: string) => {
    try {
        copyFileSync(
            path.join(process.resourcesPath, 'public', 'icon.ico'),
            path.join(rootDir, 'app.ico')
        );
    } catch {
        // The entry keeps its previous icon.
    }
};

// Explorer caches shortcut icons by the target path, which stays the same across updates.
const refreshIconCache = () => {
    try {
        const tool = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'ie4uinit.exe');
        if (!existsSync(tool)) return;
        spawn(tool, ['-show'], { detached: true, stdio: 'ignore' }).unref();
    } catch {
        // The icon refreshes when Windows rebuilds its cache.
    }
};

/**
 * Handles the Squirrel.Windows install, update and uninstall hooks. Returns true when the process
 * was started for one of them and has to quit.
 */
export const handleSquirrelEvent = () => {
    if (process.platform !== 'win32') return false;

    const command = process.argv[1];
    const exeName = path.basename(process.execPath);
    const rootDir = path.resolve(path.dirname(process.execPath), '..');
    const stubPath = path.join(rootDir, exeName);

    // The hook has to finish its work before it returns: Squirrel moves on, and the app quits.
    const runUpdateExe = (args: string[]) => {
        spawnSync(path.join(rootDir, 'Update.exe'), args, { timeout: 10_000, windowsHide: true });
    };

    switch (command) {
        case '--squirrel-install':
            runUpdateExe([`--createShortcut=${exeName}`]);
            return true;
        case '--squirrel-updated':
            removeLegacyShortcuts(stubPath);
            refreshUninstallIcon(rootDir);
            runUpdateExe([`--createShortcut=${exeName}`]);
            refreshIconCache();
            return true;
        case '--squirrel-uninstall':
            removeLegacyShortcuts(stubPath);
            runUpdateExe([`--removeShortcut=${exeName}`]);
            return true;
        case '--squirrel-obsolete':
            return true;
        default:
            return false;
    }
};
