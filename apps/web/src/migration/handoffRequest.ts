import { MIGRATE_ROUTE, OLD_ORIGIN } from './config';

/**
 * What the tab that opened the popup keeps to itself while it waits: the nonce
 * it expects echoed back and the private half of the key the payload is sealed
 * to. It lives in memory only — never storage, never a URL — and the private
 * key is not extractable, so it dies with the page that made it and can't be
 * read back out of it.
 */
export interface PendingHandoff {
    nonce: string;
    privateKey: CryptoKey;
    createdAt: number;
}

/** What is posted to the popup: the public halves only. */
export interface HandoffRequest {
    nonce: string;
    publicKey: string;
}

const KEY_PARAMS: EcKeyGenParams = { name: 'ECDH', namedCurve: 'P-256' };

const base64url = (bytes: ArrayBuffer): string =>
    btoa(String.fromCharCode(...new Uint8Array(bytes)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

/** A fresh key pair and nonce per popup, so no answer is good for two. */
export const createHandoffRequest = async (
    now = Date.now()
): Promise<{ request: HandoffRequest; pending: PendingHandoff }> => {
    const { publicKey, privateKey } = await crypto.subtle.generateKey(KEY_PARAMS, false, [
        'deriveBits'
    ]);
    const nonce = base64url(crypto.getRandomValues(new Uint8Array(16)).buffer);

    return {
        request: { nonce, publicKey: base64url(await crypto.subtle.exportKey('raw', publicKey)) },
        pending: { nonce, privateKey, createdAt: now }
    };
};

const RESUME_PATH_KEY = 'tonkeeper_migration_resume_path';

/**
 * Ask the old origin whether it still holds wallets. The answer comes back as
 * `/migrate#found` or `/migrate#none` — whether wallets are there, plus the
 * language picked there with `#found` — nothing secret, so the question needs
 * no key.
 *
 * Where the person was heading is kept in `sessionStorage` across the bounce,
 * never in the URL, so it reaches neither the old origin nor browser history.
 * Throws when the browser won't keep it, which the caller treats as a check
 * that didn't happen.
 */
export const startOldOriginCheck = (resumePath: string): string => {
    sessionStorage.setItem(RESUME_PATH_KEY, resumePath);

    return `${OLD_ORIGIN}/#check`;
};

/** Read once: the landing that uses it is the end of that round trip. */
export const takeResumePath = (): string | undefined => {
    try {
        const path = sessionStorage.getItem(RESUME_PATH_KEY) ?? undefined;
        sessionStorage.removeItem(RESUME_PATH_KEY);
        return path;
    } catch {
        return undefined;
    }
};

/**
 * Nothing leaves `/migrate` for another origin. The resume path was written by
 * this origin, but a visit to `//host/...` has a pathname that navigation reads
 * as another host, so it is resolved and kept only while it stays here.
 */
export const sameOriginPath = (path: string | undefined, origin: string): string => {
    try {
        const url = new URL(path || '/', origin);

        // A same-origin URL can still have a pathname beginning with `//`.
        // Returning that pathname to location.assign would reinterpret its
        // next segment as a host, even though the URL checked above was local.
        return url.origin === origin && !url.pathname.startsWith('//')
            ? url.pathname + url.search
            : '/';
    } catch {
        return '/';
    }
};

/**
 * Settles the old origin's "nothing here" answer before the app mounts. The
 * check it answers was never shown, so neither is the answer: the address
 * becomes the page the visit was for, and the app boots once, straight into
 * it, instead of booting `/migrate` only to leave it.
 */
export const settleCheckAnswer = (location: {
    pathname: string;
    hash: string;
    origin: string;
}): string | undefined => {
    if (location.pathname !== MIGRATE_ROUTE || location.hash !== '#none') {
        return undefined;
    }

    return sameOriginPath(takeResumePath(), location.origin);
};
