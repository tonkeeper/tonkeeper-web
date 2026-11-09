import { keepTgAuthReturn } from '@tonkeeper/core/dist/service/telegramOauth';

/**
 * Telegram's login takes the whole tab (see `telegram-widget.js`) and returns it
 * to the bot's domain, the old origin, which sends it on here with this query.
 * The old origin carries the same query in `apps/migration/src/telegramAuth.ts`.
 */
export const TG_AUTH_FORWARD_SEARCH = '?tg-auth=forward';

/**
 * Returns whether this page load is the tab coming back from Telegram. The
 * result is kept for the app to finish the trial with once it has booted.
 */
export const keepForwardedTgAuthResult = (base64Result: string): boolean => {
    if (window.location.search !== TG_AUTH_FORWARD_SEARCH) {
        return false;
    }

    keepTgAuthReturn(base64Result);
    return true;
};
