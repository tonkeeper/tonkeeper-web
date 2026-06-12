/**
 * Normalize an app version for transport to the backends.
 *
 * The backend expects a plain numeric version (e.g. `4.7.0`); release-candidate
 * and metadata suffixes such as `-rc.1` or `+build.5` are stripped so the value
 * is identical across every Tonkeeper backend (boot/api query param and the
 * `X-App-Version` header).
 */
export const trimBuildVersion = (build: string): string => build.replace(/[-+].*$/, '');

let appVersionHeaders: Record<string, string> = {};

/**
 * Set once at app startup with the running app's version and platform. These are
 * stamped as `X-App-Version` / `X-App-Platform` headers on requests to the
 * Tonkeeper backends that identify the client via headers rather than a query
 * param (TonAPI, Battery, 2FA, Pro).
 */
export const setAppVersionHeaders = (params: { version: string; platform: string }): void => {
    appVersionHeaders = {
        'X-App-Version': trimBuildVersion(params.version),
        'X-App-Platform': params.platform
    };
};

/**
 * The `X-App-*` identification headers for the current app. Returns a fresh copy
 * so callers can safely merge it into their own header objects.
 */
export const getAppVersionHeaders = (): Record<string, string> => ({ ...appVersionHeaders });
