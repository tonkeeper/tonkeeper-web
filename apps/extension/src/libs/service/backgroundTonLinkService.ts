import { ExtensionStorage } from '../storage';
import { getGlobalPreferences } from '@tonkeeper/core/dist/service/globalPreferencesService';
import { awaitPopupResponse } from './dApp/utils';
import browser from 'webextension-polyfill';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { CONNECT_EVENT_ERROR_CODES } from '@tonkeeper/core/dist/entries/tonConnect';
import { customPopupManager } from '../background/custom-popup-manager';
import ExtensionPlatform from './extension';
import { showNotificationInPopup } from './backgroundPopUpService';
import { parseInterceptableTransferLink, TonLinkOpenTarget } from '../tonTransferLink';

const storage = new ExtensionStorage();

const isUserRejection = (e: unknown) =>
    e instanceof TonConnectError && e.code === CONNECT_EVENT_ERROR_CODES.USER_REJECTS_ERROR;

export async function processInterceptTonLink(origin: string, link: unknown) {
    const url = parseInterceptableTransferLink(link);
    if (url === null) {
        throw new TonConnectError('Unsupported link', CONNECT_EVENT_ERROR_CODES.BAD_REQUEST_ERROR);
    }

    const globalPreferences = await getGlobalPreferences(storage);
    if (globalPreferences.interceptTonLinks === 'never') {
        await browser.tabs.create({ url });
        return;
    }

    const id = Date.now();

    const closePopup = await customPopupManager.openPopup();
    let target: TonLinkOpenTarget;
    try {
        showNotificationInPopup({
            kind: 'tonLinkIntercept',
            id,
            logo: await ExtensionPlatform.getActiveTabLogo(),
            origin,
            data: { url }
        });
        target = await awaitPopupResponse<TonLinkOpenTarget>(id);
    } catch (e) {
        await closePopup?.();
        if (!isUserRejection(e)) {
            await browser.tabs.create({ url });
        }
        return;
    }

    if (target === 'browser') {
        await browser.tabs.create({ url });
        await closePopup?.();
    }
}
