import { autoUpdater, BrowserWindow } from 'electron';
import packageJson from '../../package.json';

export class AutoUpdateManager {
    private readonly channel = 'stable';

    private newAvailableVersion: string | undefined = undefined;

    private win: BrowserWindow;

    // private feedBaseUrl = 'https://update.electronjs.org';
    private feedBaseUrl = 'https://tonkeeper-web-updater-test.nkuznetsov.workers.dev';

    constructor(win: BrowserWindow) {
        this.win = win;

        this.init();
    }

    private init() {
        const feedURL = `${this.feedBaseUrl}/${this.getRepoUrl()}/${process.platform}/${
            packageJson.version
        }/${this.channel}`;
        autoUpdater.setFeedURL({ url: feedURL });
        this.listenDownload();

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

    public quitAndInstall() {
        setImmediate(() => autoUpdater.quitAndInstall());
    }

    public getNewVersionAvailable() {
        return this.newAvailableVersion;
    }

    private listenDownload() {
        autoUpdater.on('update-downloaded', (_, releaseNotes, releaseName) => {
            const version = process.platform === 'win32' ? releaseNotes : releaseName;
            this.newAvailableVersion = version;
            this.win.webContents.send('app-update::ready', { version });
        });

        autoUpdater.on('error', err => {
            console.error('[AutoUpdate] updater error:', err);
        });
    }
}
