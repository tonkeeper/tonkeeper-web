import { app, autoUpdater, BrowserWindow } from 'electron';

export class AutoUpdateManager {
    private readonly githubRepo: string;

    private readonly channel = 'stable';

    private newAvailableVersion: string | undefined = undefined;

    private win: BrowserWindow;

    constructor(win: BrowserWindow, opts: { githubRepo: string }) {
        if (!opts.githubRepo || !opts.githubRepo.includes('/')) {
            throw new Error('githubRepo must be "owner/repo" format');
        }
        this.win = win;
        this.githubRepo = opts.githubRepo;

        this.init();
    }

    private init() {
        const feedURL = `https://update.electronjs.org/${
            this.githubRepo
        }/darwin/${app.getVersion()}/${this.channel}`;
        autoUpdater.setFeedURL({ url: feedURL });
        this.listenDownload();

        autoUpdater.checkForUpdates();
        setInterval(() => {
            autoUpdater.checkForUpdates();
        }, 15 * 60_000);
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
