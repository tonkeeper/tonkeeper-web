import { app } from 'electron';
import { MainWindow } from './mainWindow';

export const setDefaultProtocolClient = () => {
    console.log("setDefaultProtocolClient");

    if (!app.isDefaultProtocolClient('tc')) {

        console.log("setDefaultProtocolClient, tc...");

        app.setAsDefaultProtocolClient('tc');
        app.setAsDefaultProtocolClient('tonkeeper');
        app.setAsDefaultProtocolClient('tonkeeper-tc');
    }
}

/**
  * @description Create logic (WIN32 and Linux) for open url from protocol
  */
export const setProtocolHandlerWindowsLinux = () => {
    console.log("setProtocolHandlerWindowsLinux")
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
        app.whenReady().then(async () => {
            // Open main windows
            await MainWindow.openMainWindow();
            MainWindow.mainWindow.webContents.send('tc', process.argv.pop().slice(0, -1));
        });
    } else {
        app.quit();
    }
}


/**
 * @description Create logic (OSX) for open url from protocol
 */
export const setProtocolHandlerOSX = () => {
    console.log("setProtocolHandlerOSX")

    app.on('open-url', (event: Electron.Event, url: string) => {
        event.preventDefault();
        app.whenReady().then(async () => {
            await MainWindow.openMainWindow();
            MainWindow.mainWindow.webContents.send('tc', url);
        });
    });
}