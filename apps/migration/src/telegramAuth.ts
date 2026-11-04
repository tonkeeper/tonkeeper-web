/**
 * Telegram's login returns here: shipped desktop and mobile builds name this
 * origin as their OAuth origin, and it is the domain the bot is registered for.
 * The result arrives in the fragment and is handed on before routing gets a
 * chance to redirect it away.
 */
const TG_AUTH_RESULT = /[#?&]tgAuthResult=([A-Za-z0-9\-_]*)$/;

/** The result as standard base64, the form the mobile bridge expects. */
export const readTgAuthResult = (hash: string): string | undefined => {
    const match = TG_AUTH_RESULT.exec(hash);
    if (!match) {
        return undefined;
    }

    const base64 = match[1].replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;

    return padding ? base64 + '='.repeat(4 - padding) : base64;
};

export interface TgAuthWindow {
    tonkeeper?: { tgAuth?: { sendResult?: (base64Result: string) => unknown } };
    opener: Pick<Window, 'postMessage'> | null;
    close(): void;
}

const decodeAuthData = (base64: string): unknown => {
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
};

/**
 * Returns whether the result reached someone. The mobile app's in-app browser
 * injects a bridge, and its native side checks this page's origin. A popup
 * posts to its opener, but only to the wallet on the new origin: desktop's
 * opener isn't a web origin and so receives nothing, and reads the result from
 * Telegram itself once this window closes.
 */
export const deliverTgAuthResult = (
    base64: string,
    target: TgAuthWindow,
    newOrigin: string
): boolean => {
    const bridge = target.tonkeeper?.tgAuth;
    if (typeof bridge?.sendResult === 'function') {
        bridge.sendResult(base64);
        return true;
    }

    if (!target.opener) {
        return false;
    }

    let authData: unknown;
    try {
        authData = decodeAuthData(base64);
    } catch {
        return false;
    }

    target.opener.postMessage(
        JSON.stringify({ event: 'auth_result', result: authData }),
        newOrigin
    );
    target.close();
    return true;
};
