import { AppKey } from '../Keys';
import { IStorage } from '../Storage';

export type PopupOpener = 'icon-click' | `programmatically-${number}`;

export type OpenedPopup = {
    id: number;
    opener: PopupOpener;
};

export function setOpenedPopup(storage: IStorage, popup: OpenedPopup | null) {
    return storage.set(AppKey.EXTENSION_POPUP_ID, popup);
}

export async function getOpenedPopup(storage: IStorage): Promise<OpenedPopup | undefined> {
    const value = await storage.get(AppKey.EXTENSION_POPUP_ID);
    if (!value) {
        return undefined;
    }

    return value as OpenedPopup;
}
