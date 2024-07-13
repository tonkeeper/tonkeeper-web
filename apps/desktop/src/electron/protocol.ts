import { delay } from '@tonkeeper/core/dist/utils/common';
import { app } from 'electron';
import log from 'electron-log/main';
import { MainWindow } from './mainWindow';

export const setDefaultProtocolClient = () => {
    const protocols = ['ton', 'tc', 'tonkeeper', 'tonkeeper-tc'];
    const isDefaultProtocolClient = protocols.every(protocol => app.isDefaultProtocolClient(protocol));
    if (!isDefaultProtocolClient) {
        protocols.forEach(protocol => app.setAsDefaultProtocolClient(protocol));
    }
};

/**
 * @description Create logic (WIN32 and Linux) for open url from protocol
 */
export const setProtocolHandlerWindowsLinux = () => {
    // Force Single Instance Application
    const gotTheLock = app.requestSingleInstanceLock();

    app.on('second-instance', async (e: Electron.Event, argv: string[]) => {
        const window = await MainWindow.bringToFront();

        const url = argv.pop();
        if (url.startsWith('--')) return;

        log.info({ secondInsUrl: url });
        app.whenReady().then(() => {
            window.webContents.send('tc', url);
        });
    });

    if (gotTheLock) {
        app.whenReady().then(() => {
            // Open main windows
            initMainWindow();
        });
    } else {
        app.quit();
    }
};

/**
 * @description Create logic (OSX) for open url from protocol
 */
export const setProtocolHandlerOSX = () => {
    app.whenReady().then(() => {
        initMainWindow();
    });

    app.on('open-url', (event: Electron.Event, url: string) => {
        event.preventDefault();
        log.info({ openUrl: url });

        app.whenReady().then(async () => {
            const window = await MainWindow.openMainWindow();

            window.show();
            window.webContents.send('tc', url);
        });
    });
};

const initMainWindow = async () => {
    // Open main windows
    log.info({ initArgs: process.argv });
    const window = await MainWindow.openMainWindow();

    if (process.argv.length === 1) return;
    try {
        await delay(500);
        const url = process.argv.pop();
        if (url.startsWith('--') || url.startsWith('.')) return;

        log.info({ initUrl: url });

        if (url != null) {
            window.webContents.send('tc', url);
        }
    } catch (e) {
        log.error(e);
    }
};
