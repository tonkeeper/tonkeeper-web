import { autoUpdater, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import packageJson from '../../package.json';
import { mainStorage } from './storageService';

export class AutoUpdateManager {
    public static versionDownloadedKey = 'versionDownloaded';

    private readonly channel = 'stable';

    private newAvailableVersion: string | undefined = undefined;

    private win: BrowserWindow;

    // private feedBaseUrl = 'https://update.electronjs.org';
    private feedBaseUrl = 'https://tonkeeper-web-updater-test.nkuznetsov.workers.dev';

    public static async quitAndInstallIfFlagged() {
        const flagged = await mainStorage.get(AutoUpdateManager.versionDownloadedKey);
        if (flagged) {
            return AutoUpdateManager.quitAndInstall();
        }
    }

    public static async quitAndInstall() {
        await mainStorage.delete(AutoUpdateManager.versionDownloadedKey);
        setImmediate(() => autoUpdater.quitAndInstall());
        return true;
    }

    constructor(win: BrowserWindow) {
        this.win = win;

        this.init();
    }

    private async init() {
        const feedURL = `${this.feedBaseUrl}/${this.getRepoUrl()}/${process.platform}/${
            packageJson.version
        }/${this.channel}`;
        autoUpdater.setFeedURL({ url: feedURL });
        this.listenDownload();

        const exited = await AutoUpdateManager.quitAndInstallIfFlagged();
        if (exited) {
            return;
        }

        autoUpdater.checkForUpdates();
        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 15 * 60_000);
    }

    private getRepoUrl(): string {
        return packageJson.repository.url
            .replace(/^git\+/, '')
            .replace(/^https:\/\/github\.com\//, '')
            .replace(/\.git$/, '')
            .trim();
    }

    public getNewVersionAvailable() {
        return this.newAvailableVersion;
    }

    private listenDownload() {
        autoUpdater.on('update-downloaded', (_, releaseNotes, releaseName) => {
            const version = process.platform === 'win32' ? releaseNotes : releaseName;
            this.newAvailableVersion = version;
            this.win.webContents.send('app-update::ready', { version });
            mainStorage.set(AutoUpdateManager.versionDownloadedKey, version);
            log.log('[AutoUpdate] updater new version fetched:', version);
        });

        autoUpdater.on('error', err => {
            log.error('[AutoUpdate] updater error:', err);
        });
    }
}
