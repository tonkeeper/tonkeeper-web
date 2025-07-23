import browser from 'webextension-polyfill';
import { checkForError } from '../utils';
import { delay } from '@tonkeeper/core/dist/utils/common';

type Opener = 'icon-click' | `programmatically-${number}`;

export class PopupManager {
    static createOpenerId() {
        return Date.now();
    }

    private static NOTIFICATION_HEIGHT = 650;

    private static NOTIFICATION_WIDTH = 380;

    private openedPopup:
        | {
              id: number;
              opener: Opener;
          }
        | undefined;

    get openedPopupIdAssertNotNullish(): number {
        if (this.openedPopup === undefined) {
            throw new Error('Popup is not opened');
        }

        return this.openedPopup.id;
    }

    constructor() {
        browser.windows.onRemoved.addListener(() => {
            this.openedPopup = undefined;
        });
    }

    public async openPopup(source: 'icon-click' | 'programmatically' = 'programmatically') {
        const opener: Opener =
            source === 'icon-click'
                ? 'icon-click'
                : `programmatically-${PopupManager.createOpenerId()}`;

        if (this.openedPopup === undefined) {
            const id = (await this.createPopup()).id!;
            this.openedPopup = { id, opener };
        } else {
            if (this.openedPopup.opener !== 'icon-click') {
                this.openedPopup = { ...this.openedPopup, opener };
            }
            await this.focusPopup();
        }

        await this.ensurePopupReady();
        return () => this.closePopupOpenedByOpener(opener);
    }

    public async closePopupOpenedByOpener(opener: Opener) {
        if (this.openedPopup?.opener === opener) {
            return this.closePopup();
        }
    }

    private async closePopup() {
        if (this.openedPopup === undefined) {
            return;
        }

        await browser.windows.remove(this.openedPopup.id);
        this.openedPopup = undefined;
    }

    private createPopup() {
        return new Promise<browser.Windows.Window>(async (resolve, reject) => {
            const windowInfo = await browser.windows.getLastFocused();
            const left =
                windowInfo.left! + windowInfo.width! - PopupManager.NOTIFICATION_WIDTH - 10;
            const top = windowInfo.top! + 40;

            const newWindow = await browser.windows.create({
                url: 'index.html',
                type: 'popup',
                width: PopupManager.NOTIFICATION_WIDTH,
                height: PopupManager.NOTIFICATION_HEIGHT,
                left,
                top
            });
            this.rejectIfError(reject);
            resolve(newWindow);
        });
    }

    private async ensurePopupReady() {
        await delay(200);
    }

    private focusPopup() {
        return new Promise((resolve, reject) => {
            browser.windows
                .update(this.openedPopupIdAssertNotNullish, { focused: true })
                .then(() => {
                    this.rejectIfError(reject);
                    resolve(undefined);
                });
        });
    }

    private rejectIfError(rejectHandle: (e: Error) => void) {
        const error = checkForError();
        if (error) {
            rejectHandle(error);
        }
    }
}

export const popupManager = new PopupManager();
