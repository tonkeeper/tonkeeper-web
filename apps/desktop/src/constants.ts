export const mainWindowName = 'main_window';

export function isMainWindowUrl(url: string) {
    try {
        let path = new URL(url).pathname;
        if (path.startsWith('/')) {
            path = path.slice(1);
        }
        if (path.endsWith('/')) {
            path = path.slice(0, -1);
        }

        return path === mainWindowName;
    } catch (e) {
        console.error(e);
        return false;
    }
}
