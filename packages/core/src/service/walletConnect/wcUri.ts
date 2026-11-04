const WC_URI_PATTERN = /^wc:[0-9a-f]{64}@2\?.+/i;

/**
 * Extracts a WalletConnect v2 pairing URI from user input: the raw
 * `wc:{topic}@2?...` form (with tolerated `wc://` and surrounding
 * whitespace), or the URI wrapped in a link's `uri` query parameter
 * (`tonkeeper://wc?uri=...`, `https://wallet.tonkeeper.com/wc?uri=...`).
 * Returns the normalized `wc:` URI, or `null` when the input is not a
 * WalletConnect pairing link.
 */
export const parseWalletConnectUri = (input: string): string | null => {
    const trimmed = input.trim().replace(/^wc:\/\//i, 'wc:');

    if (WC_URI_PATTERN.test(trimmed)) {
        return trimmed;
    }

    let wrapped: URL;
    try {
        wrapped = new URL(trimmed);
    } catch (e) {
        return null;
    }
    const uriParam = wrapped.searchParams.get('uri');
    if (uriParam === null) {
        return null;
    }
    const unwrapped = uriParam.trim().replace(/^wc:\/\//i, 'wc:');
    return WC_URI_PATTERN.test(unwrapped) ? unwrapped : null;
};

/**
 * WalletConnect *redirect-back* links — the URLs a dApp opens purely to
 * bring the wallet to the foreground after a session handoff
 * (`…/wc?requestId=…&sessionTopic=…`, bare `…/wc`, link-mode
 * `…/wc?wc_ev=…&topic=…`, `…/wc/session/request`). They carry no `uri`
 * pairing parameter and must be ignored silently: parsing them as a
 * pairing attempt surfaces a bogus "unsupported link" error on what is
 * only a "come back to the app" ping. A link whose `uri` is present but
 * malformed is NOT a redirect — that one is a real failure the caller
 * should report.
 */
export const isWalletConnectRedirectUrl = (input: string): boolean => {
    let url: URL;
    try {
        url = new URL(input.trim());
    } catch (e) {
        return false;
    }
    if (url.searchParams.has('uri')) {
        return false;
    }
    // `https://…/wc[/…]` puts `wc` in the path; `tonkeeper://wc?…` puts it
    // in the host with an empty path.
    const path = url.pathname.replace(/\/+$/, '');
    return path === '/wc' || path.startsWith('/wc/') || (url.host === 'wc' && path === '');
};
