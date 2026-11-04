export const mainWindowName = 'main_window';

const documentPath = (url: URL) => url.pathname.replace(/\/+$/, '');

export function isAppDocumentUrl(url: string, appEntryUrl: string) {
    try {
        const actual = new URL(url);
        const expected = new URL(appEntryUrl);
        return (
            actual.protocol === expected.protocol &&
            actual.host === expected.host &&
            documentPath(actual) === documentPath(expected)
        );
    } catch {
        return false;
    }
}
