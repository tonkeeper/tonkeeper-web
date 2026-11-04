export type TonLinkOpenTarget = 'extension' | 'browser';

const TONKEEPER_APP_HOST = 'app.tonkeeper.com';

const pathSegments = (pathname: string) => pathname.replace(/\/$/, '').split('/').slice(1);

/**
 * `ton://transfer/<recipient>` or `https://app.tonkeeper.com/transfer/<recipient>`,
 * returned in normalized form so callers act on exactly the link that was
 * matched. Other links on the same schemes reach unrelated deeplink handlers,
 * so the match is exact rather than by prefix.
 */
export const parseInterceptableTransferLink = (href: unknown): string | null => {
    if (typeof href !== 'string') {
        return null;
    }

    let url: URL;
    try {
        url = new URL(href);
    } catch {
        return null;
    }

    if (url.username || url.password || url.port) {
        return null;
    }

    let recipient: string[];
    if (url.protocol === 'ton:' && url.host === 'transfer') {
        recipient = pathSegments(url.pathname);
    } else if (url.protocol === 'https:' && url.host === TONKEEPER_APP_HOST) {
        const [operation, ...rest] = pathSegments(url.pathname);
        if (operation !== 'transfer') {
            return null;
        }
        recipient = rest;
    } else {
        return null;
    }

    return recipient.length === 1 && recipient[0] !== '' ? url.href : null;
};
