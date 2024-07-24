import { autoUpdater, BrowserWindow } from 'electron';

export default class AppUpdate {
    constructor() {
        autoUpdater.addListener('update-available', function (event) {
            console.log('update available');
        });
        autoUpdater.addListener(
            'update-downloaded',
            function (event, releaseNotes, releaseName, releaseDate, updateURL) {
                notify(
                    'A new update is ready to install',
                    `Version ${releaseName} is downloaded and will be automatically installed on Quit`
                );
            }
        );
        autoUpdater.addListener('error', function (error) {
            console.log(error);
        });
        autoUpdater.addListener('checking-for-update', function (event) {
            console.log('checking-for-update');
        });

        autoUpdater.addListener('update-not-available', function (event) {
            notify('Tonkeeper Pro is up to date', `Version ${releaseName}`);
        });

        const feedURL =
            'https://update.electronjs.org/tonkeeper/tonkeeper-web/darwin-arm64/3.17.2;

        autoUpdater.setFeedURL(feedURL);
    }

    check() {
        autoUpdater.checkForUpdates();
    }
}

function notify(title, message) {
    let windows = BrowserWindow.getAllWindows();
    if (windows.length == 0) {
        return;
    }

    window.webContents.send('notify', title, message);
}
