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
