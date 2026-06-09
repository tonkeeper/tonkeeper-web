export function getWindow(): Window | undefined {
    if (typeof window !== 'undefined') {
        return window;
    }
}

export function hasProperties<T extends string>(
    value: unknown,
    propertyKeys: T[]
): value is Record<T, unknown> {
    if (!value || typeof value !== 'object') {
        return false;
    }

    return propertyKeys.every(propertyKey => propertyKey in value);
}

export function hasProperty<T extends string>(
    value: unknown,
    propertyKey: T
): value is Record<T, unknown> {
    return hasProperties(value, [propertyKey]);
}

interface Options {
    bot_id: string;
    request_access?: string;
    lang?: string;
}

export interface TGLoginData {
    auth_date: number;
    first_name: string;
    hash: string;
    id: number;
    last_name: string;
    username: string;

    photo_url: string;
}

type Callback = (dataOrFalse: TGLoginData | false) => void;

function isTGAvailable(window: Window): window is Window & {
    Telegram: { Login: { auth: (options: Options, callback: Callback) => void } };
} {
    return (
        hasProperty(window, 'Telegram') &&
        hasProperty(window.Telegram, 'Login') &&
        hasProperty(window.Telegram.Login, 'auth') &&
        typeof window.Telegram.Login.auth === 'function'
    );
}

export async function loginViaTG(botId: string, lang?: string): Promise<TGLoginData | null> {
    const window = getWindow();
    if (!window) {
        return null;
    }

    if (!isTGAvailable(window)) {
        throw new Error('Telegram auth provider not found');
    }
    return new Promise(res => {
        window.Telegram.Login.auth({ bot_id: botId, request_access: 'write', lang }, data => {
            res(data || null);
        });
    });
}

export function getTgAuthResult(): string | false {
    const locationHash = window.location.hash.toString();
    const re = /[#?&]tgAuthResult=([A-Za-z0-9\-_]*)$/;
    const match = locationHash.match(re);

    if (!match) return false;

    try {
        let data = match[1] || '';
        data = data.replace(/-/g, '+').replace(/_/g, '/');

        const pad = data.length % 4;
        if (pad > 0) {
            data += '='.repeat(4 - pad);
        }

        return data;
    } catch (e) {
        return false;
    }
}

/**
 * Sends Telegram OAuth result to the opener window via postMessage.
 * Used in popup OAuth flow on web and desktop platforms.
 * Mobile uses a different mechanism (Native Bridge + CustomEvent).
 *
 * @param tgAuthResult - Base64 encoded string with auth data from URL hash
 * @returns true if successfully sent and window closed, false if no opener or error
 */
export function sendTgAuthResultToOpener(tgAuthResult: string): boolean {
    const currentWindow = getWindow();

    if (!currentWindow?.opener) {
        return false;
    }

    try {
        const authData: TGLoginData = JSON.parse(atob(tgAuthResult));
        // Restrict delivery to a same-origin opener. The legitimate opener is the Tonkeeper
        // app that opened this popup, so it always shares the popup's origin. Using '*' here
        // would leak the Telegram identity to any cross-origin opener (e.g. a phishing site
        // that opened the OAuth popup with return_to pointing back at us).
        currentWindow.opener.postMessage(
            JSON.stringify({ event: 'auth_result', result: authData }),
            currentWindow.location.origin
        );
        currentWindow.close();
        return true;
    } catch (e) {
        console.error('Failed to send tg auth result to opener', e);
        return false;
    }
}
