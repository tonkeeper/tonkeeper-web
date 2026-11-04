// A deploy replaces every hashed chunk, so a tab opened on the previous build
// fails its next lazy import: the old file is gone and the SPA fallback answers
// with HTML. The browser also caches the failed import, so the feature stays
// broken until a reload picks up the new build. The guard keeps a chunk that is
// broken in the current build from reloading the page in a loop.
const LAST_RELOAD_KEY = 'tk-stale-chunk-reload-at';
const MIN_RELOAD_INTERVAL_MS = 10_000;

const readLastReload = (): number => {
    try {
        return Number(sessionStorage.getItem(LAST_RELOAD_KEY)) || 0;
    } catch {
        return 0;
    }
};

const markReload = (): boolean => {
    try {
        sessionStorage.setItem(LAST_RELOAD_KEY, String(Date.now()));
        return true;
    } catch {
        return false;
    }
};

window.addEventListener('vite:preloadError', event => {
    if (Date.now() - readLastReload() < MIN_RELOAD_INTERVAL_MS) return;
    if (!markReload()) return;
    event.preventDefault();
    window.location.reload();
});

export {};
