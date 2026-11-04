import { isAppDocumentUrl } from '../constants';

export const TELEGRAM_AUTH_DATA_URL = 'https://oauth.telegram.org/auth/get';

interface RequestFrame {
    url: string;
    parent: unknown;
}

export interface RequestOrigin {
    webContentsId?: number;
    frame?: RequestFrame | null;
}

const parseHttpsUrl = (url: string) => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === 'https:' ? parsed : undefined;
    } catch {
        return undefined;
    }
};

/**
 * Hosts the app calls from its file:// document whose responses don't allow
 * that origin, so the main process adds the CORS header itself.
 */
export const isCorsExemptUrl = (url: string) => {
    if (url === TELEGRAM_AUTH_DATA_URL) {
        return true;
    }
    const parsed = parseHttpsUrl(url);
    if (!parsed) {
        return false;
    }
    const { hostname } = parsed;
    return (
        hostname === 'api.mercuryo.io' ||
        hostname === 'tonkeeper.com' ||
        hostname.endsWith('.tonkeeper.com')
    );
};

export const isAppDocumentRequest = (
    request: RequestOrigin,
    appWebContentsId: number | undefined,
    appEntryUrl: string
) =>
    appWebContentsId !== undefined &&
    request.webContentsId === appWebContentsId &&
    !!request.frame &&
    request.frame.parent === null &&
    isAppDocumentUrl(request.frame.url, appEntryUrl);

/**
 * A request from the app window that has no frame (a CORS preflight, or a
 * frame already gone) has no document left to read the response, so it still
 * gets the CORS header. Cookies go only to the app document itself.
 */
export const isAppCorsRequest = (
    request: RequestOrigin,
    appWebContentsId: number | undefined,
    appEntryUrl: string
) =>
    isAppDocumentRequest(request, appWebContentsId, appEntryUrl) ||
    (appWebContentsId !== undefined &&
        request.webContentsId === appWebContentsId &&
        !request.frame);

export interface PermissionRequestDetails {
    isMainFrame: boolean;
    requestingUrl: string;
    mediaTypes?: readonly string[];
}

export interface PermissionCheckDetails {
    isMainFrame: boolean;
    requestingUrl?: string;
    securityOrigin?: string;
    mediaType?: string;
}

const trimOrigin = (origin: string) => origin.replace(/\/+$/, '');

const appOrigin = (appEntryUrl: string) => {
    const entry = new URL(appEntryUrl);
    return entry.protocol === 'file:' ? 'file:' : entry.origin;
};

const isAppCheckSource = (
    requestingOrigin: string,
    details: PermissionCheckDetails,
    appEntryUrl: string
) => {
    if (!details.isMainFrame) {
        return false;
    }
    if (details.requestingUrl) {
        return isAppDocumentUrl(details.requestingUrl, appEntryUrl);
    }
    const origin = details.securityOrigin ?? requestingOrigin;
    return trimOrigin(origin) === appOrigin(appEntryUrl);
};

/**
 * Permissions the app document asks for: clipboard for copy and paste, the
 * camera for QR scanning.
 */
export const isAppPermissionRequest = (
    permission: string,
    details: PermissionRequestDetails,
    fromAppWindow: boolean,
    appEntryUrl: string
) => {
    if (
        !fromAppWindow ||
        !details.isMainFrame ||
        !isAppDocumentUrl(details.requestingUrl, appEntryUrl)
    ) {
        return false;
    }
    switch (permission) {
        case 'clipboard-read':
        case 'clipboard-sanitized-write':
            return true;
        case 'media':
            return (
                !!details.mediaTypes &&
                details.mediaTypes.length > 0 &&
                details.mediaTypes.every(type => type === 'video')
            );
        default:
            return false;
    }
};

/**
 * Same as `isAppPermissionRequest`, plus HID and USB for Ledger. Checks
 * without a WebContents are matched by origin only.
 */
export const isAppPermissionCheck = (
    permission: string,
    requestingOrigin: string,
    details: PermissionCheckDetails,
    fromAppWindow: boolean,
    appEntryUrl: string
) => {
    if (!fromAppWindow || !isAppCheckSource(requestingOrigin, details, appEntryUrl)) {
        return false;
    }
    switch (permission) {
        case 'clipboard-read':
        case 'clipboard-sanitized-write':
        case 'hid':
        case 'usb':
            return true;
        case 'media':
            return details.mediaType !== 'audio';
        default:
            return false;
    }
};
