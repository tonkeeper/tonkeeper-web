import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('electron', () => ({
    app: { getVersion: vi.fn(() => '4.6.1') },
    BrowserWindow: { getAllWindows: vi.fn(() => []) }
}));
vi.mock('electron-log/main', () => ({
    default: { warn: vi.fn(), info: vi.fn() }
}));

import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';
import {
    _resetForTesting,
    checkOnce,
    evaluateRelease,
    isNewer,
    startUpdateCheck
} from '../updateCheck';

describe('isNewer', () => {
    it('returns true when the latest version is strictly greater', () => {
        expect(isNewer('4.7.0', '4.6.1')).toBe(true);
        expect(isNewer('5.0.0', '4.99.99')).toBe(true);
        expect(isNewer('4.6.2', '4.6.1')).toBe(true);
    });

    it('returns false when versions are equal', () => {
        expect(isNewer('4.6.1', '4.6.1')).toBe(false);
    });

    it('returns false when the latest is older', () => {
        expect(isNewer('4.5.9', '4.6.0')).toBe(false);
        expect(isNewer('3.99.99', '4.0.0')).toBe(false);
    });

    it('compares minor and patch correctly when major is equal', () => {
        expect(isNewer('4.6.1', '4.5.99')).toBe(true);
        expect(isNewer('4.5.99', '4.6.0')).toBe(false);
    });

    it('strips pre-release suffixes before comparing', () => {
        // Pre-release suffix on the right of the dash is ignored, so these
        // compare as equal numerics and are not "newer".
        expect(isNewer('4.7.0-beta.1', '4.7.0')).toBe(false);
        expect(isNewer('4.7.0', '4.7.0-beta.1')).toBe(false);
    });

    it('treats missing components as zero', () => {
        expect(isNewer('4.7', '4.6.1')).toBe(true);
        expect(isNewer('4', '3.99.99')).toBe(true);
        expect(isNewer('4.6.1.1', '4.6.1')).toBe(true);
    });

    it('tolerates non-numeric junk by parsing as 0', () => {
        expect(isNewer('abc', '4.6.1')).toBe(false);
        expect(isNewer('4.6.1', 'abc')).toBe(true);
    });
});

describe('evaluateRelease', () => {
    const baseRelease = {
        tag_name: 'v4.7.0',
        html_url: 'https://github.com/tonkeeper/tonkeeper-web/releases/tag/v4.7.0',
        draft: false,
        prerelease: false
    };

    it('returns UpdateInfo for a newer stable release', () => {
        expect(evaluateRelease(baseRelease, '4.6.1', undefined)).toEqual({
            version: '4.7.0',
            url: baseRelease.html_url
        });
    });

    it('strips the leading v from the tag', () => {
        const result = evaluateRelease(
            { ...baseRelease, tag_name: 'v10.0.0' },
            '9.0.0',
            undefined
        );
        expect(result?.version).toBe('10.0.0');
    });

    it('accepts tag names without a v prefix', () => {
        const result = evaluateRelease(
            { ...baseRelease, tag_name: '4.7.0' },
            '4.6.1',
            undefined
        );
        expect(result?.version).toBe('4.7.0');
    });

    it('returns undefined for draft releases', () => {
        expect(evaluateRelease({ ...baseRelease, draft: true }, '4.6.1', undefined)).toBeUndefined();
    });

    it('returns undefined for pre-releases', () => {
        expect(
            evaluateRelease({ ...baseRelease, prerelease: true }, '4.6.1', undefined)
        ).toBeUndefined();
    });

    it('returns undefined when no tag_name is present', () => {
        expect(
            evaluateRelease({ ...baseRelease, tag_name: undefined }, '4.6.1', undefined)
        ).toBeUndefined();
    });

    it('returns undefined when the response is null or undefined', () => {
        expect(evaluateRelease(null, '4.6.1', undefined)).toBeUndefined();
        expect(evaluateRelease(undefined, '4.6.1', undefined)).toBeUndefined();
    });

    it('returns undefined when the release is older than the current version', () => {
        expect(evaluateRelease(baseRelease, '4.7.0', undefined)).toBeUndefined();
        expect(evaluateRelease(baseRelease, '4.8.0', undefined)).toBeUndefined();
    });

    it('returns undefined when the version was previously notified', () => {
        expect(evaluateRelease(baseRelease, '4.6.1', '4.7.0')).toBeUndefined();
    });

    it('still returns UpdateInfo when a different older version was notified', () => {
        expect(evaluateRelease(baseRelease, '4.6.1', '4.6.5')).toEqual({
            version: '4.7.0',
            url: baseRelease.html_url
        });
    });

    it('falls back to the releases-latest URL when html_url is missing', () => {
        const result = evaluateRelease(
            { ...baseRelease, html_url: undefined },
            '4.6.1',
            undefined
        );
        expect(result?.url).toBe('https://github.com/tonkeeper/tonkeeper-web/releases/latest');
    });
});

describe('checkOnce', () => {
    const mockedFetch = vi.fn();

    beforeEach(() => {
        _resetForTesting();
        vi.stubGlobal('fetch', mockedFetch);
        vi.mocked(app.getVersion).mockReturnValue('4.6.1');
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([]);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    function mockJsonResponse(body: unknown, ok = true, status = 200) {
        mockedFetch.mockResolvedValueOnce({
            ok,
            status,
            json: async () => body
        } as Response);
    }

    function makeWindow() {
        return { webContents: { send: vi.fn() } };
    }

    it('broadcasts update-available to every open window when a newer release exists', async () => {
        const win1 = makeWindow();
        const win2 = makeWindow();
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([win1, win2] as never);
        mockJsonResponse({
            tag_name: 'v4.7.0',
            html_url: 'https://example.com/v4.7.0',
            draft: false,
            prerelease: false
        });

        await checkOnce();

        const expectedPayload = { version: '4.7.0', url: 'https://example.com/v4.7.0' };
        expect(win1.webContents.send).toHaveBeenCalledWith('update-available', expectedPayload);
        expect(win2.webContents.send).toHaveBeenCalledWith('update-available', expectedPayload);
        expect(log.info).toHaveBeenCalledWith('update available: 4.7.0');
    });

    it('does not broadcast the same version twice in a row', async () => {
        const win = makeWindow();
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([win] as never);
        mockJsonResponse({
            tag_name: 'v4.7.0',
            html_url: 'https://example.com/v4.7.0',
            draft: false,
            prerelease: false
        });
        mockJsonResponse({
            tag_name: 'v4.7.0',
            html_url: 'https://example.com/v4.7.0',
            draft: false,
            prerelease: false
        });

        await checkOnce();
        await checkOnce();

        expect(win.webContents.send).toHaveBeenCalledTimes(1);
    });

    it('broadcasts again when a later version appears after one was already notified', async () => {
        const win = makeWindow();
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([win] as never);
        mockJsonResponse({
            tag_name: 'v4.7.0',
            html_url: 'https://example.com/v4.7.0',
            draft: false,
            prerelease: false
        });
        mockJsonResponse({
            tag_name: 'v4.8.0',
            html_url: 'https://example.com/v4.8.0',
            draft: false,
            prerelease: false
        });

        await checkOnce();
        await checkOnce();

        expect(win.webContents.send).toHaveBeenCalledTimes(2);
        expect(win.webContents.send).toHaveBeenLastCalledWith('update-available', {
            version: '4.8.0',
            url: 'https://example.com/v4.8.0'
        });
    });

    it('does not broadcast drafts or pre-releases', async () => {
        const win = makeWindow();
        vi.mocked(BrowserWindow.getAllWindows).mockReturnValue([win] as never);
        mockJsonResponse({ tag_name: 'v4.7.0', draft: true });
        mockJsonResponse({ tag_name: 'v4.7.0', prerelease: true });

        await checkOnce();
        await checkOnce();

        expect(win.webContents.send).not.toHaveBeenCalled();
    });

    it('logs and returns quietly on non-2xx HTTP responses', async () => {
        mockJsonResponse({}, false, 502);

        await expect(checkOnce()).resolves.toBeUndefined();
        expect(log.warn).toHaveBeenCalledWith('update check: HTTP 502');
    });

    it('logs and returns quietly on network errors without throwing', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('ECONNRESET'));

        await expect(checkOnce()).resolves.toBeUndefined();
        expect(log.warn).toHaveBeenCalledWith('update check failed', expect.any(Error));
    });

    it('uses the GitHub Releases /latest endpoint with a Tonkeeper user-agent', async () => {
        mockJsonResponse({ tag_name: 'v4.6.1', draft: false, prerelease: false });

        await checkOnce();

        expect(mockedFetch).toHaveBeenCalledWith(
            'https://api.github.com/repos/tonkeeper/tonkeeper-web/releases/latest',
            expect.objectContaining({
                headers: expect.objectContaining({
                    'User-Agent': 'Tonkeeper/4.6.1',
                    Accept: 'application/vnd.github+json'
                })
            })
        );
    });
});

describe('startUpdateCheck', () => {
    const origPlatform = process.platform;

    function setPlatform(value: NodeJS.Platform) {
        Object.defineProperty(process, 'platform', { value, configurable: true });
    }

    beforeEach(() => {
        _resetForTesting();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        setPlatform(origPlatform);
    });

    it('schedules timers on Linux', () => {
        setPlatform('linux');
        startUpdateCheck();
        expect(vi.getTimerCount()).toBeGreaterThan(0);
    });

    it('does not schedule timers on macOS', () => {
        setPlatform('darwin');
        startUpdateCheck();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('does not schedule timers on Windows', () => {
        setPlatform('win32');
        startUpdateCheck();
        expect(vi.getTimerCount()).toBe(0);
    });

    it('is idempotent — repeated calls on Linux do not duplicate timers', () => {
        setPlatform('linux');
        startUpdateCheck();
        const after1 = vi.getTimerCount();
        startUpdateCheck();
        startUpdateCheck();
        expect(vi.getTimerCount()).toBe(after1);
    });
});
