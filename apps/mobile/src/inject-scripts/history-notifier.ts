export function setupHistoryNotifier() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    function notifyUrlChange() {
        window.webkit?.messageHandlers?.browserMessages?.postMessage({
            type: 'url-changed'
        });
    }

    history.pushState = function (...args) {
        originalPushState.apply(this, args);
        notifyUrlChange();
    };

    history.replaceState = function (...args) {
        originalReplaceState.apply(this, args);
        notifyUrlChange();
    };

    window.addEventListener('popstate', notifyUrlChange);
    window.addEventListener('hashchange', notifyUrlChange);
}
