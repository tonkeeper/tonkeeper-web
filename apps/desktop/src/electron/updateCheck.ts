import { app, BrowserWindow } from 'electron';
import log from 'electron-log/main';

const RELEASES_URL =
    'https://api.github.com/repos/tonkeeper/tonkeeper-web/releases/latest';
const INITIAL_DELAY_MS = 15_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

export interface UpdateInfo {
    version: string;
    url: string;
}

export interface ReleaseResponse {
    tag_name?: string;
    html_url?: string;
    prerelease?: boolean;
    draft?: boolean;
}

let lastNotified: string | undefined;
let timer: NodeJS.Timeout | undefined;

export function isNewer(latest: string, current: string): boolean {
    const parse = (v: string) =>
        v.split('-')[0]
            .split('.')
            .map(n => parseInt(n, 10) || 0);
    const a = parse(latest);
    const b = parse(current);
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
        const x = a[i] ?? 0;
        const y = b[i] ?? 0;
        if (x !== y) return x > y;
    }
    return false;
}

export function evaluateRelease(
    release: ReleaseResponse | null | undefined,
    currentVersion: string,
    previouslyNotified: string | undefined
): UpdateInfo | undefined {
    if (!release || !release.tag_name || release.draft || release.prerelease) return undefined;
    const latest = release.tag_name.replace(/^v/, '');
    if (!isNewer(latest, currentVersion)) return undefined;
    if (previouslyNotified === latest) return undefined;
    return {
        version: latest,
        url: release.html_url ?? 'https://github.com/tonkeeper/tonkeeper-web/releases/latest'
    };
}

export async function checkOnce() {
    try {
        const res = await fetch(RELEASES_URL, {
            headers: {
                'User-Agent': `Tonkeeper/${app.getVersion()}`,
                Accept: 'application/vnd.github+json'
            }
        });
        if (!res.ok) {
            log.warn(`update check: HTTP ${res.status}`);
            return;
        }
        const release = (await res.json()) as ReleaseResponse;
        const update = evaluateRelease(release, app.getVersion(), lastNotified);
        if (!update) return;

        lastNotified = update.version;
        for (const win of BrowserWindow.getAllWindows()) {
            win.webContents.send('update-available', update);
        }
        log.info(`update available: ${update.version}`);
    } catch (e) {
        log.warn('update check failed', e);
    }
}

export function startUpdateCheck() {
    if (timer) return;
    // Auto-update notifications elsewhere: macOS via Squirrel.Mac (update-electron-app),
    // Windows via Squirrel.Windows. Linux has no built-in updater, so the banner is its
    // only update signal.
    if (process.platform !== 'linux') return;
    setTimeout(checkOnce, INITIAL_DELAY_MS);
    timer = setInterval(checkOnce, CHECK_INTERVAL_MS);
}

export function _resetForTesting() {
    lastNotified = undefined;
    if (timer) {
        clearInterval(timer);
        timer = undefined;
    }
}
