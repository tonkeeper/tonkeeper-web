/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, describe, expect, it } from 'vitest';
import { getOsName } from '../os';

const setNavigator = (nav: unknown) => {
    (globalThis as { navigator?: unknown }).navigator = nav;
};

const clearNavigator = () => {
    delete (globalThis as { navigator?: unknown }).navigator;
};

describe('getOsName', () => {
    afterEach(clearNavigator);

    it('returns undefined when navigator is missing', () => {
        clearNavigator();
        expect(getOsName()).toBeUndefined();
    });

    it('prefers navigator.userAgentData.platform when present', () => {
        setNavigator({ userAgentData: { platform: 'macOS' }, userAgent: 'lies' });
        expect(getOsName()).toBe('macOS');
    });

    it.each([
        ['Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36', 'macOS'],
        ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Windows'],
        ['Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36', 'Linux'],
        ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15', 'iOS'],
        ['Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36', 'Android']
    ])('parses %s as %s', (ua, expected) => {
        setNavigator({ userAgent: ua });
        expect(getOsName()).toBe(expected);
    });

    it('returns undefined when nothing matches', () => {
        setNavigator({ userAgent: 'Foo/1.0' });
        expect(getOsName()).toBeUndefined();
    });
});
