import { app } from 'electron';
import log from 'electron-log/main';
import { MainWindow } from './mainWindow';

export const setDefaultProtocolClient = () => {
    if (!app.isDefaultProtocolClient('tc')) {
        app.setAsDefaultProtocolClient('tc');
        app.setAsDefaultProtocolClient('tonkeeper');
        app.setAsDefaultProtocolClient('tonkeeper-tc');
    }
};

/**
 * @description Create logic (WIN32 and Linux) for open url from protocol
 */
export const setProtocolHandlerWindowsLinux = () => {
    log.info('setProtocolHandlerWindowsLinux');
    // Force Single Instance Application
    const gotTheLock = app.requestSingleInstanceLock();

    app.on('second-instance', (e: Electron.Event, argv: string[]) => {
        // Someone tried to run a second instance, we should focus our window.
        if (MainWindow.mainWindow) {
            if (MainWindow.mainWindow.isMinimized()) MainWindow.mainWindow.restore();
            MainWindow.mainWindow.focus();
        } else {
            // Open main windows
            MainWindow.openMainWindow();
        }

        app.whenReady().then(() => {
            MainWindow.mainWindow.webContents.send('tc', argv.pop().slice(0, -1));
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
    log.info('setProtocolHandlerOSX');

    app.whenReady().then(() => {
        initMainWindow();
    });

    app.on('open-url', (event: Electron.Event, url: string) => {
        event.preventDefault();
        log.info({ url });

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

    if (process.argv.length == 1) return;
    try {
        const url = process.argv.pop().slice(0, -1);
        log.info({ url });

        if (url != null) {
            window.webContents.send('tc', url);
        }
    } catch (e) {
        log.error(e);
    }
};
