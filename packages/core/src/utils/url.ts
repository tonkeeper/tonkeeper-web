export const removeLastSlash = (url: string) => url.replace(/\/$/, '');

export function eqOrigins(origin1: string, origin2: string | undefined): boolean {
    return origin2 !== undefined && removeLastSlash(origin1) === removeLastSlash(origin2);
}

export function originFromUrl(url: string): string | undefined {
    try {
        const parsed = new URL(url);
        return removeLastSlash(parsed.origin);
    } catch (e) {
        console.error(e);
        return undefined;
    }
}

export function isLocalhost(url: string): boolean {
    const origin = originFromUrl(url);
    if (!origin) {
        return false;
    }

    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
