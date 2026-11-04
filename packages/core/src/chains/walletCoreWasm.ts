/**
 * chain-kit's Trust Wallet Core loader is an emscripten build that resolves
 * `wallet-core.wasm` against its own script base. Once a bundler inlines that
 * loader into the app bundle, the base collapses to the document/route base,
 * so the request lands on a wrong path — a nested SPA route on the web, the
 * service-worker scope in the extension, the lazy chunk's folder on desktop,
 * and so on. The loader ships no `locateFile` hook and chain-kit's `ready()`
 * exposes no way to pass one, so the only seam is the request itself.
 *
 * The loader reads the binary with `fetch`, except for `file://` URLs (the
 * packaged desktop renderer), where it falls back to an async
 * `XMLHttpRequest`. Both are rewritten.
 *
 * Install this once, before chain-kit's `ready()` first runs: it pins any
 * request whose path ends in `wallet-core.wasm` to the single URL the current
 * shell actually serves the binary from. `resolveTarget` returns that URL —
 * e.g. `'/wallet-core.wasm'` on the web,
 * `chrome.runtime.getURL('wallet-core.wasm')` in the extension. It is called
 * per request so it works even before the extension APIs or location are
 * available at module-eval time.
 *
 * Runs in both window and service-worker contexts (uses `globalThis`, not
 * `window`; `XMLHttpRequest` is patched only where it exists), and is
 * idempotent — a second install is a no-op.
 */
type FetchFn = typeof fetch;

const INSTALLED = Symbol.for('tonkeeper.walletCoreWasmShim');

interface ShimmedGlobal {
    [INSTALLED]?: true;
    fetch?: FetchFn;
    XMLHttpRequest?: typeof XMLHttpRequest;
    location?: { href: string; origin: string };
}

export const installWalletCoreWasmShim = (resolveTarget: () => string): void => {
    const scope = globalThis as unknown as ShimmedGlobal;

    if (scope[INSTALLED] || typeof scope.fetch !== 'function') {
        return;
    }

    // Returns the absolute target for a `wallet-core.wasm` request, or
    // `undefined` to leave the request untouched. Always substitutes the
    // absolute target: passing a relative input through — even one that
    // resolves correctly against the base — lets the browser re-resolve it
    // against the current SPA route, where the fallback answers with HTML.
    const redirect = (href: string): string | undefined => {
        try {
            // Resolve against the live location: the loader requests a
            // relative `wallet-core.wasm`, and after an SPA pushState the
            // document base is the current route, not the page it loaded on.
            const base = scope.location?.href;
            if (new URL(href, base).pathname.endsWith('/wallet-core.wasm')) {
                return new URL(resolveTarget(), base).href;
            }
        } catch (e) {
            /* leave the request untouched */
        }
        return undefined;
    };

    const originalFetch = scope.fetch.bind(globalThis) as FetchFn;

    scope.fetch = (input, init) => {
        const href =
            typeof input === 'string'
                ? input
                : input instanceof URL
                ? input.href
                : (input as Request).url;
        const target = redirect(href);
        return target ? originalFetch(target, init) : originalFetch(input, init);
    };

    const xhrProto = scope.XMLHttpRequest?.prototype;
    if (xhrProto) {
        const originalOpen = xhrProto.open as (
            this: XMLHttpRequest,
            method: string,
            url: string | URL,
            ...rest: unknown[]
        ) => void;

        xhrProto.open = function (
            this: XMLHttpRequest,
            method: string,
            url: string | URL,
            ...rest: unknown[]
        ) {
            const target = redirect(url instanceof URL ? url.href : String(url));
            return originalOpen.call(this, method, target ?? url, ...rest);
        } as XMLHttpRequest['open'];
    }

    scope[INSTALLED] = true;
};
