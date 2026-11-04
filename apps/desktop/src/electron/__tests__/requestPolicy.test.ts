import { describe, expect, it } from 'vitest';
import {
    isAppCorsRequest,
    isAppDocumentRequest,
    isAppPermissionCheck,
    isAppPermissionRequest,
    isCorsExemptUrl
} from '../requestPolicy';

const entry =
    'file:///Applications/Keeper.app/Contents/Resources/app/.webpack/renderer/main_window/index.html';
const appId = 1;
interface Frame {
    url: string;
    parent: Frame | null;
}

const topFrame = (url: string): Frame => ({ url, parent: null });
const childFrame = (url: string): Frame => ({ url, parent: topFrame(entry) });

describe('isCorsExemptUrl', () => {
    it('accepts the app backends', () => {
        expect(isCorsExemptUrl('https://tonkeeper.com/')).toBe(true);
        expect(isCorsExemptUrl('https://api.tonkeeper.com/v1/config')).toBe(true);
        expect(isCorsExemptUrl('https://a.b.tonkeeper.com/path?x=1')).toBe(true);
        expect(isCorsExemptUrl('https://api.mercuryo.io/v1.6/rates')).toBe(true);
        expect(isCorsExemptUrl('https://oauth.telegram.org/auth/get')).toBe(true);
    });

    it('rejects other hosts that mention them', () => {
        expect(isCorsExemptUrl('https://other.test/auth?url=https://tonkeeper.com/')).toBe(false);
        expect(
            isCorsExemptUrl('https://127.0.0.1:8080/auth?probe=trusted&url=https://tonkeeper.com/')
        ).toBe(false);
        expect(isCorsExemptUrl('https://tonkeeperXcom/')).toBe(false);
        expect(isCorsExemptUrl('https://tonkeeper.com.other.test/')).toBe(false);
        expect(isCorsExemptUrl('https://othertonkeeper.com/')).toBe(false);
        expect(isCorsExemptUrl('https://api.mercuryo.io.other.test/')).toBe(false);
        expect(isCorsExemptUrl('https://other.test/plain')).toBe(false);
    });

    it('rejects plain http and other Telegram paths', () => {
        expect(isCorsExemptUrl('http://tonkeeper.com/')).toBe(false);
        expect(isCorsExemptUrl('https://oauth.telegram.org/auth')).toBe(false);
        expect(isCorsExemptUrl('not a url')).toBe(false);
    });
});

describe('isAppDocumentRequest', () => {
    it('accepts requests from the app top frame', () => {
        expect(
            isAppDocumentRequest({ webContentsId: appId, frame: topFrame(entry) }, appId, entry)
        ).toBe(true);
    });

    it('rejects frames inside the app', () => {
        expect(
            isAppDocumentRequest(
                { webContentsId: appId, frame: childFrame('https://other.test/') },
                appId,
                entry
            )
        ).toBe(false);
    });

    it('rejects other windows and other documents', () => {
        expect(
            isAppDocumentRequest({ webContentsId: 2, frame: topFrame(entry) }, appId, entry)
        ).toBe(false);
        expect(
            isAppDocumentRequest(
                { webContentsId: appId, frame: topFrame('https://other.test/main_window') },
                appId,
                entry
            )
        ).toBe(false);
    });

    it('rejects requests without a frame', () => {
        expect(isAppDocumentRequest({ webContentsId: appId, frame: null }, appId, entry)).toBe(
            false
        );
        expect(isAppDocumentRequest({ webContentsId: appId }, appId, entry)).toBe(false);
    });

    it('rejects everything before the app window exists', () => {
        expect(
            isAppDocumentRequest({ webContentsId: appId, frame: topFrame(entry) }, undefined, entry)
        ).toBe(false);
    });
});

describe('isAppCorsRequest', () => {
    it('accepts the app top frame and frameless requests from the app window', () => {
        expect(
            isAppCorsRequest({ webContentsId: appId, frame: topFrame(entry) }, appId, entry)
        ).toBe(true);
        expect(isAppCorsRequest({ webContentsId: appId, frame: null }, appId, entry)).toBe(true);
    });

    it('rejects frames inside the app and other windows', () => {
        expect(
            isAppCorsRequest(
                { webContentsId: appId, frame: childFrame('https://other.test/') },
                appId,
                entry
            )
        ).toBe(false);
        expect(isAppCorsRequest({ webContentsId: 2, frame: null }, appId, entry)).toBe(false);
        expect(isAppCorsRequest({ frame: null }, appId, entry)).toBe(false);
    });
});

describe('isAppPermissionRequest', () => {
    const fromApp = { isMainFrame: true, requestingUrl: entry };

    it('grants clipboard access and the camera to the app document', () => {
        expect(isAppPermissionRequest('clipboard-read', fromApp, true, entry)).toBe(true);
        expect(isAppPermissionRequest('clipboard-sanitized-write', fromApp, true, entry)).toBe(
            true
        );
        expect(
            isAppPermissionRequest('media', { ...fromApp, mediaTypes: ['video'] }, true, entry)
        ).toBe(true);
    });

    it('denies the microphone and anything else', () => {
        expect(
            isAppPermissionRequest(
                'media',
                { ...fromApp, mediaTypes: ['video', 'audio'] },
                true,
                entry
            )
        ).toBe(false);
        expect(isAppPermissionRequest('media', fromApp, true, entry)).toBe(false);
        expect(isAppPermissionRequest('geolocation', fromApp, true, entry)).toBe(false);
        expect(isAppPermissionRequest('notifications', fromApp, true, entry)).toBe(false);
        expect(isAppPermissionRequest('openExternal', fromApp, true, entry)).toBe(false);
    });

    it('denies frames, other documents and other windows', () => {
        expect(
            isAppPermissionRequest(
                'clipboard-read',
                { isMainFrame: false, requestingUrl: entry },
                true,
                entry
            )
        ).toBe(false);
        expect(
            isAppPermissionRequest(
                'clipboard-read',
                { isMainFrame: true, requestingUrl: 'https://tonstakers.com/' },
                true,
                entry
            )
        ).toBe(false);
        expect(isAppPermissionRequest('clipboard-read', fromApp, false, entry)).toBe(false);
    });
});

describe('isAppPermissionCheck', () => {
    const fromApp = { isMainFrame: true, requestingUrl: entry };

    it('allows clipboard, camera, HID and USB for the app document', () => {
        for (const permission of ['clipboard-read', 'clipboard-sanitized-write', 'hid', 'usb']) {
            expect(isAppPermissionCheck(permission, 'file:///', fromApp, true, entry)).toBe(true);
        }
        expect(
            isAppPermissionCheck(
                'media',
                'file:///',
                { ...fromApp, mediaType: 'video' },
                true,
                entry
            )
        ).toBe(true);
    });

    it('matches checks without a requesting URL by origin', () => {
        expect(
            isAppPermissionCheck(
                'hid',
                'file:///',
                { isMainFrame: true, securityOrigin: 'file:///' },
                true,
                entry
            )
        ).toBe(true);
        expect(
            isAppPermissionCheck(
                'hid',
                'https://other.test',
                { isMainFrame: true, securityOrigin: 'https://other.test' },
                true,
                entry
            )
        ).toBe(false);
        expect(
            isAppPermissionCheck(
                'hid',
                'http://localhost:3000',
                { isMainFrame: true },
                true,
                'http://localhost:3000/main_window'
            )
        ).toBe(true);
    });

    it('denies the microphone, other permissions, frames and other sources', () => {
        expect(
            isAppPermissionCheck(
                'media',
                'file:///',
                { ...fromApp, mediaType: 'audio' },
                true,
                entry
            )
        ).toBe(false);
        expect(isAppPermissionCheck('geolocation', 'file:///', fromApp, true, entry)).toBe(false);
        expect(
            isAppPermissionCheck(
                'clipboard-read',
                'file:///',
                { isMainFrame: false, requestingUrl: entry },
                true,
                entry
            )
        ).toBe(false);
        expect(
            isAppPermissionCheck(
                'clipboard-read',
                'https://tonstakers.com',
                { isMainFrame: true, requestingUrl: 'https://tonstakers.com/' },
                true,
                entry
            )
        ).toBe(false);
        expect(isAppPermissionCheck('clipboard-read', 'file:///', fromApp, false, entry)).toBe(
            false
        );
    });
});
