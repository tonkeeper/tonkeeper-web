import { IStorage } from '@tonkeeper/core/dist/Storage';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { Language } from '@tonkeeper/core/dist/entries/language';

import { OLD_ORIGIN } from './config';

/**
 * How long the old origin gets to prove it is still answering. Someone opening
 * their wallet is waiting behind this, so a slow origin counts as a down one.
 */
const REACHABILITY_TIMEOUT_MS = 2000;

/**
 * Crawlers get the app, not a bounce to another domain: a redirect away from
 * the canonical origin on first visit is exactly what indexing must not see.
 */
const CRAWLER_PATTERN = /bot|crawler|spider|slurp|headless|lighthouse|preview/i;

/**
 * What a visit to this origin does about the wallet that may still be sitting
 * on the previous one. Every outcome but `check` leaves the app to boot as if
 * no migration were happening.
 */
export type ArrivalDecision =
    | { kind: 'check' }
    | { kind: 'skip'; reason: 'accounts-exist' | 'crawler' | 'already-checked' };

export interface ArrivalInput {
    /** Whether this profile already holds wallets here. */
    hasAccounts: boolean;
    /** Whether the old origin has already answered for this profile. */
    hasChecked: boolean;
    userAgent: string;
}

/**
 * Conditions are evaluated top to bottom and the first match wins, the mirror
 * of `resolveMigrationScreen` on the old origin. Wallets here outrank
 * everything: a profile that already has one is never sent looking for another.
 */
export const resolveArrival = (input: ArrivalInput): ArrivalDecision => {
    if (input.hasAccounts) {
        return { kind: 'skip', reason: 'accounts-exist' };
    }

    if (CRAWLER_PATTERN.test(input.userAgent)) {
        return { kind: 'skip', reason: 'crawler' };
    }

    if (input.hasChecked) {
        return { kind: 'skip', reason: 'already-checked' };
    }

    return { kind: 'check' };
};

/**
 * What the `/migrate` landing opens on. Nothing in its URL is trusted with
 * more than which screen to show, and in what language: wallets only ever
 * arrive over the popup channel, never in a link, so a crafted `/migrate` URL
 * can at most show the offer to move.
 */
export type MigrateLanding = {
    kind: 'offer';
    found: boolean;
    /**
     * How the visit got here, for analytics only: the old origin's answer to
     * the boot check, its "Move my wallets" button, or by hand.
     */
    from: 'check' | 'old_domain' | 'manual';
    language?: Language;
};

const isLanguage = (value: number): value is Language => Object.values(Language).includes(value);

/**
 * `#found` is the old origin's answer to the boot check and `#move` its "Move
 * my wallets" button; both mean wallets are there. Anything else is a visit by
 * hand. "Nothing here" never gets this far — `settleCheckAnswer` turns it into
 * the page the visit was for before the app mounts.
 *
 * `#found&lang=N` and `#move&lang=N` also name the language picked on the old
 * origin: this one has no wallet yet, so no setting of its own. It only changes
 * what the page is shown in — nothing is stored — and a value that isn't a
 * `Language` is ignored.
 */
export const resolveMigrateLanding = (fragment: string): MigrateLanding => {
    const [screen, ...rest] = fragment.split('&');

    if (screen !== 'found' && screen !== 'move') {
        return { kind: 'offer', found: false, from: 'manual' };
    }

    const from = screen === 'found' ? 'check' : 'old_domain';

    const lang = new URLSearchParams(rest.join('&')).get('lang');
    const language = lang !== null && /^\d+$/.test(lang) ? Number(lang) : undefined;

    return language !== undefined && isLanguage(language)
        ? { kind: 'offer', found: true, from, language }
        : { kind: 'offer', found: true, from };
};

/**
 * Whether the old origin is still there to ask. `no-cors` because there is
 * nothing to read back — the response is opaque either way, and the whole
 * answer is whether the request resolved or threw.
 *
 * An origin that is down must not strand anyone on a dead navigation, so this
 * runs before the bounce rather than discovering the problem after it.
 */
export const isOldOriginReachable = async (): Promise<boolean> => {
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), REACHABILITY_TIMEOUT_MS);

    try {
        await fetch(`${OLD_ORIGIN}/`, {
            mode: 'no-cors',
            cache: 'no-store',
            signal: abort.signal
        });

        return true;
    } catch {
        return false;
    } finally {
        clearTimeout(timeout);
    }
};

export const hasCheckedOldOrigin = async (storage: IStorage): Promise<boolean> =>
    (await storage.get<boolean>(AppKey.MIGRATION_OLD_ORIGIN_CHECKED)) === true;

/**
 * The flag records that the old origin was *asked*, not what it answered, and
 * it is written as the request leaves rather than when a reply arrives. Every
 * way a round trip can end without importing — declined, closed mid-way, a
 * payload that didn't verify — comes back to this origin looking exactly like a
 * first visit, and asking again on each of them would bounce someone between
 * two domains forever.
 *
 * It is not a lock: the way back in on the start screen ignores it entirely, so
 * a failed handoff can always be retried on purpose. A check that never got
 * sent — the origin was unreachable — leaves it alone and is tried again.
 */
export const markOldOriginAsked = async (storage: IStorage): Promise<void> => {
    await storage.set(AppKey.MIGRATION_OLD_ORIGIN_CHECKED, true);
};
