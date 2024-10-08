import AppUpdate from './autoUpdate';
import * as osLocale from 'os-locale';
import resources from '@tonkeeper/locales/dist/i18n/resources.json';
import { Dict } from 'styled-components/dist/types';

const locale = osLocale.osLocaleSync();

const fixed = locale.slice(0, 2);
const all = resources as any as Dict<(typeof resources)['en']>;
const dist = all[locale] ?? all[fixed] ?? resources['en'];

const EditMenu: Electron.MenuItemConstructorOptions = {
    label: dist.translation.Edit,
    submenu: [
        {
            label: dist.translation.Undo,
            accelerator: 'CmdOrCtrl+Z',
            role: 'undo'
        },
        {
            label: dist.translation.Redo,
            accelerator: 'Shift+CmdOrCtrl+Z',
            role: 'redo'
        },
        {
            type: 'separator'
        },
        {
            label: dist.translation.Cut,
            accelerator: 'CmdOrCtrl+X',
            role: 'cut'
        },
        {
            label: dist.translation.Copy,
            accelerator: 'CmdOrCtrl+C',
            role: 'copy'
        },
        {
            label: dist.translation.paste,
            accelerator: 'CmdOrCtrl+V',
            role: 'paste'
        },
        {
            label: dist.translation.select_all,
            accelerator: 'CmdOrCtrl+A',
            role: 'selectAll'
        }
    ]
};

const WindowMenu: Electron.MenuItemConstructorOptions = {
    label: dist.translation.Window,
    role: 'window',
    submenu: [
        {
            label: dist.translation.Minimize,
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
        },
        {
            label: dist.translation.close,
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
        },
        {
            type: 'separator'
        },
        {
            label: dist.translation.bring_all_to_front,
            role: 'front'
        }
    ]
};

const getDarwinMenu = (update: AppUpdate): Electron.MenuItemConstructorOptions => {
    return {
        label: 'Tonkeeper',
        submenu: [
            {
                label: dist.translation.about_tonkeeper_pro,
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
                label: dist.translation.hide_tonkeeper_pro,
                accelerator: 'Command+H',
                role: 'hide'
            },
            {
                label: dist.translation.hide_others,
                accelerator: 'Command+Shift+H',
                role: 'hideOthers'
            },
            {
                label: dist.translation.show_all,
                role: 'unhide'
            },
            {
                type: 'separator'
            },
            {
                label: dist.translation.quit_tonkeeper_pro,
                accelerator: 'Command+Q',
                role: 'quit'
            }
        ]
    };
};

const getWinMenu = (update: AppUpdate): Electron.MenuItemConstructorOptions => {
    return {
        label: 'Tonkeeper',
        submenu: [
            {
                label: dist.translation.about_tonkeeper_pro,
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
                label: dist.translation.quit_tonkeeper_pro,
                accelerator: 'Command+Q',
                role: 'quit'
            }
        ]
    };
};

const ViewMenu: Electron.MenuItemConstructorOptions = {
    label: dist.translation.View,
    submenu: [
        {
            label: dist.translation.Reload,
            accelerator: 'CmdOrCtrl+R',
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.reload();
                }
            }
        },
        {
            label: dist.translation.force_reload,
            accelerator: 'Shift+CmdOrCtrl+R',
            role: 'forceReload'
        },
        {
            label: dist.translation.toggle_full_screen,
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
            label: dist.translation.toggle_developer_tools,
            accelerator: (function () {
                if (process.platform === 'darwin') return 'Alt+Command+I';
                else return 'Ctrl+Shift+I';
            })(),
            click: function (item, focusedWindow) {
                if (focusedWindow) {
                    focusedWindow.webContents.toggleDevTools();
                }
            }
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
