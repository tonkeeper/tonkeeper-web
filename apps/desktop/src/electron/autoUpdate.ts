import { autoUpdater, BrowserWindow, webContents } from 'electron';

export default class AppUpdate {
    constructor() {
        autoUpdater.addListener('update-available', function (event: any) {
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
        autoUpdater.addListener('checking-for-update', function (event: any) {
            console.log('checking-for-update');
        });

        autoUpdater.addListener('update-not-available', function (event: any) {
            notify('Tonkeeper Pro is up to date', `Version 123`); //${releaseName}`);
        });

        const feedURL = 'https://update.electronjs.org/tonkeeper/tonkeeper-web/darwin-arm64/3.17.2';

        autoUpdater.setFeedURL({ url: feedURL });
    }

    check() {
        autoUpdater.checkForUpdates();
    }
}

function notify(title: string, message: string) {
    let windows = BrowserWindow.getAllWindows();
    if (windows.length == 0) {
        return;
    }

    //  window[0].webContents.send('notify', title, message);
}
