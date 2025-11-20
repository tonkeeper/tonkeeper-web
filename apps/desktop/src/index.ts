import { delay, hideSensitiveData } from '@tonkeeper/core/dist/utils/common';
import { BrowserWindow, app, powerMonitor } from 'electron';
import log from 'electron-log/main';
import { MainWindow } from './electron/mainWindow';
import {
    setDefaultProtocolClient,
    setProtocolHandlerOSX,
    setProtocolHandlerWindowsLinux
} from './electron/protocol';
import { tonConnectSSE } from './electron/sseEvetns';
import { AutoUpdateManager } from './electron/autoUpdate';

app.setName('Tonkeeper Pro');

log.initialize({ preload: true });
log.info('Application start-up');
log.hooks.push((message, _, transportName) => {
    if (transportName !== 'file') return message;

    const joined = message.data.join().toLowerCase();

    const modified = hideSensitiveData(joined);

    if (modified !== joined) {
        return false;
    }

    return message;
});

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
    app.quit();
}

const onUnLock = () => {
    log.info('unlock-screen');
    tonConnectSSE.reconnect();
};

if (process.platform !== 'linux') {
    powerMonitor.on('unlock-screen', onUnLock);
}

app.on('before-quit', async e => {
    try {
        e.preventDefault();
        tonConnectSSE.destroy();
        if (process.platform !== 'linux') {
            powerMonitor.off('unlock-screen', onUnLock);
        }
    } catch (e) {
        console.error(e);
    }

    await delay(100);

    try {
        const exited = AutoUpdateManager.quitAndInstallIfFlagged();
        if (!exited) {
            app.exit();
        }
    } catch (e) {
        console.error(e);
        app.exit();
    }
});

setDefaultProtocolClient();

switch (process.platform) {
    case 'darwin':
        setProtocolHandlerOSX();
        break;
    case 'linux':
    case 'win32':
        setProtocolHandlerWindowsLinux();
        break;
    default:
        throw new Error('Process platform is undefined');
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
// app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
        MainWindow.openMainWindow();
    }
});
