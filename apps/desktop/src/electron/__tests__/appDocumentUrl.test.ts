import { describe, expect, it } from 'vitest';
import { isAppDocumentUrl } from '../../constants';

const packagedEntry =
    'file:///Applications/Keeper.app/Contents/Resources/app/.webpack/renderer/main_window/index.html';
const devEntry = 'http://localhost:3000/main_window';

describe('isAppDocumentUrl', () => {
    it('accepts the entry document', () => {
        expect(isAppDocumentUrl(packagedEntry, packagedEntry)).toBe(true);
        expect(isAppDocumentUrl(devEntry, devEntry)).toBe(true);
    });

    it('ignores query, hash and a trailing slash', () => {
        expect(isAppDocumentUrl(`${packagedEntry}#/settings`, packagedEntry)).toBe(true);
        expect(isAppDocumentUrl(`${devEntry}/?reload=1`, devEntry)).toBe(true);
    });

    it('rejects other origins serving the same path', () => {
        expect(isAppDocumentUrl('https://example.com/main_window', devEntry)).toBe(false);
        expect(isAppDocumentUrl('http://localhost:3001/main_window', devEntry)).toBe(false);
        expect(
            isAppDocumentUrl(
                'https://example.com/Applications/Keeper.app/Contents/Resources/app/.webpack/renderer/main_window/index.html',
                packagedEntry
            )
        ).toBe(false);
    });

    it('rejects other local documents', () => {
        expect(isAppDocumentUrl('file:///tmp/main_window/index.html', packagedEntry)).toBe(false);
        expect(isAppDocumentUrl('http://localhost:3000/other', devEntry)).toBe(false);
    });

    it('rejects malformed urls', () => {
        expect(isAppDocumentUrl('', packagedEntry)).toBe(false);
        expect(isAppDocumentUrl('not a url', packagedEntry)).toBe(false);
        expect(isAppDocumentUrl('about:blank', packagedEntry)).toBe(false);
    });
});
