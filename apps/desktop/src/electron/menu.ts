import AppUpdate from './autoUpdate';
import { translation } from './mainProcessLocale';

const EditMenu: Electron.MenuItemConstructorOptions = {
    label: translation.Edit,
    submenu: [
        {
            label: translation.Undo,
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        },
        {
            label: translation.Redo,
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        },
        {
            type: 'separator'
        },
        {
            label: translation.Cut,
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        },
        {
            label: translation.Copy,
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        },
        {
            label: translation.paste,
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        },
        {
            label: translation.select_all,
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll'
        }
    ]
};

const WindowMenu: Electron.MenuItemConstructorOptions = {
    label: translation.Window,
    role: 'window',
    submenu: [
        {
            label: translation.Minimize,
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        },
        {
            label: translation.close,
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        },
        {
            type: 'separator'
        },
        {
            label: translation.bring_all_to_front,
            role: 'front'
        }
    ]
};

const getDarwinMenu = (update: AppUpdate): Electron.MenuItemConstructorOptions => {
    return {
        label: 'Keeper',
        submenu: [
            {
                label: translation.about_tonkeeper_pro,
                role: 'about'
            },
            {
                type: 'separator'
            },
            // {
            //     label: dist.translaction.check_for_updates,
            //     click: function () {
            //         update.check();
            //     }
            // },
            // {
            //     type: 'separator'
            // },
            {
                label: translation.hide_tonkeeper_pro,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: translation.hide_others,
                accelerator: 'Command+Shift+H',
                role: 'hideOthers'
            },
            {
                label: translation.show_all,
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: translation.quit_tonkeeper_pro,
                accelerator: 'Command+Q',
                role: 'quit'
            }
        ]
    };
};

const getWinMenu = (update: AppUpdate): Electron.MenuItemConstructorOptions => {
    return {
        label: 'Keeper',
        submenu: [
            {
                label: translation.about_tonkeeper_pro,
                role: 'about'
            },
            // {
            //     type: 'separator'
            // },
            // {
            //     label: dist.translaction.check_for_updates,
            //     click: function () {
            //         update.check();
            //     }
            // },
            {
                type: 'separator'
            },
            {
                label: translation.quit_tonkeeper_pro,
                accelerator: 'Command+Q',
                role: 'quit'
            }
        ]
    };
};

const ViewMenu: Electron.MenuItemConstructorOptions = {
    label: translation.View,
    submenu: [
        {
            label: translation.Reload,
            accelerator: 'CmdOrCtrl+R',
            role: 'reload'
        },
        {
            label: translation.force_reload,
            accelerator: 'Shift+CmdOrCtrl+R',
            role: 'forceReload'
        },
        {
            label: translation.toggle_full_screen,
            accelerator: (function () {
                if (process.platform === 'darwin') return 'Ctrl+Command+F';
                else return 'F11';
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.setFullScreen(!focusedWindow.isFullScreen());
                }
            }
        },
        {
            type: 'separator'
        },
        {
            label: translation.toggle_developer_tools,
            accelerator: (function () {
                if (process.platform === 'darwin') return 'Alt+Command+I';
                else return 'Ctrl+Shift+I';
            })(),
            role: 'toggleDevTools'
        }
    ]
};

export const createAppMenu = (
    update: AppUpdate
): (Electron.MenuItemConstructorOptions | Electron.MenuItem)[] => {
    return [
        process.platform === 'darwin' ? getDarwinMenu(update) : getWinMenu(update),
        EditMenu,
        ViewMenu,
        WindowMenu
    ];
};
