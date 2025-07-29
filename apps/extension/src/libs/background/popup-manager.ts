import browser from 'webextension-polyfill';
import { checkForError } from '../utils';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { ExtensionStorage } from '../storage';

type Opener = 'icon-click' | `programmatically-${number}`;

type OpenedPopup = {
    id: number;
    opener: Opener;
};

export class PopupManager {
    static createOpenerId() {
        return Date.now();
    }

    private static NOTIFICATION_HEIGHT = 650;

    private static NOTIFICATION_WIDTH = 430;

    private storage = new ExtensionStorage();

    setOpenedPopup(popup: OpenedPopup | null) {
        return this.storage.set('openedPopup', popup);
    }

    async getOpenedPopup(): Promise<OpenedPopup | undefined> {
        const value = await this.storage.get('openedPopup');
        if (!value) {
            return undefined;
        }

        return value as OpenedPopup;
    }

    constructor() {
        browser.windows.onRemoved.addListener(async windowId => {
            const openedPopup = await this.getOpenedPopup();
            if (openedPopup?.id === windowId) {
                await this.setOpenedPopup(null);
            }
        });
        this.syncPopup();
    }

    public async openPopup(source: 'icon-click' | 'programmatically' = 'programmatically') {
        await this.syncPopup();
        const opener: Opener =
            source === 'icon-click'
                ? 'icon-click'
                : `programmatically-${PopupManager.createOpenerId()}`;

        const openedPopup = await this.getOpenedPopup();

        if (openedPopup === undefined) {
            const id = (await this.createPopup()).id!;
            await this.setOpenedPopup({ id, opener });
        } else {
            if (openedPopup.opener !== 'icon-click') {
                await this.setOpenedPopup({ ...openedPopup, opener });
            }
            await this.focusPopup();
        }

        await this.ensurePopupReady();
        return () => this.closePopupOpenedByOpener(opener);
    }

    public async closePopupOpenedByOpener(opener: Opener) {
        const openedPopup = await this.getOpenedPopup();
        if (openedPopup?.opener === opener) {
            return this.closePopup();
        }
    }

    private async closePopup() {
        const openedPopup = await this.getOpenedPopup();
        if (openedPopup === undefined) {
            return;
        }

        await browser.windows.remove(openedPopup.id);
        await this.setOpenedPopup(null);
    }

    private async createPopup() {
        const windowInfo = await browser.windows.getLastFocused();
        const left = windowInfo.left! + windowInfo.width! - PopupManager.NOTIFICATION_WIDTH - 10;
        const top = windowInfo.top! + 40;

        const newWindow = await browser.windows.create({
            url: 'index.html',
            type: 'popup',
            width: PopupManager.NOTIFICATION_WIDTH,
            height: PopupManager.NOTIFICATION_HEIGHT,
            left,
            top
        });
        this.rejectIfError();
        return newWindow;
    }

    private async ensurePopupReady() {
        await delay(200);
    }

    private async focusPopup() {
        const openedPopup = await this.getOpenedPopup();
        if (!openedPopup) {
            throw new Error('Popup is not opened');
        }

        await browser.windows.update(openedPopup.id, { focused: true });
        this.rejectIfError();
    }

    private async syncPopup() {
        const popupId = (await this.getOpenedPopup())?.id;

        if (popupId !== undefined) {
            try {
                await browser.windows.get(popupId);
            } catch (e) {
                await this.setOpenedPopup(null);
            }
        }
    }

    private rejectIfError() {
        const error = checkForError();
        if (error) {
            throw error;
        }
    }
}

export const popupManager = new PopupManager();
