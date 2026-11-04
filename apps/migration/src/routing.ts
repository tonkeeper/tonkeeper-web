import { MIGRATE_PATH } from './config';

/**
 * Paths other apps still deeplink into this origin. Shipped desktop and mobile
 * builds, signer returns and dApp connect links all point here, so they are
 * forwarded with their query intact rather than answered.
 */
const FORWARDED_PATH_PREFIXES = ['/ton-connect', '/wc', '/signer'];

/** Where this origin shows its own secrets, the one thing only it can do. */
export const MANUAL_RECOVERY_PATH = '/recover';

/** The page the new origin opens as a popup to take the wallets over. */
export const HANDOFF_POPUP_PATH = '/handoff';

/**
 * Every outcome a visit to this origin can have. Wallet UI is not one of them —
 * it is never served here.
 */
export type MigrationScreen =
    /**
     * The new origin asked whether wallets are here. The answer carries nothing
     * secret — that bit and the language setting — so it is given straight
     * away, with no screen.
     */
    | { kind: 'check-answer'; target: string }
    /** Opened by the new origin to take the wallets over. */
    | { kind: 'handoff-popup'; hasWalletData: boolean; canRecoverManually: boolean }
    /** A deeplink meant for the wallet: hand it on, query and fragment intact. */
    | { kind: 'forward-deeplink'; target: string }
    /** Nothing to offer, or already handed over: go to the new origin. */
    | { kind: 'redirect'; reason: 'already-migrated' | 'no-wallet-data' }
    /**
     * Nothing to offer, but opened from a Home Screen icon, which stays pinned
     * to this origin: say how to replace the icon instead of redirecting on
     * every launch.
     */
    | { kind: 'home-screen-moved' }
    /** Hand the secrets back instead of handing them over. */
    | { kind: 'manual-recovery' }
    /** Wallet data is here and untouched: explain the move and offer it. */
    | { kind: 'we-moved'; canRecoverManually: boolean; isHomeScreenApp: boolean };

export interface MigrationRouteInput {
    pathname: string;
    search: string;
    hash: string;
    /** Whether this origin's storage still holds wallet data. */
    hasWalletData: boolean;
    /** Whether a handoff from this profile already completed. */
    hasMigrated: boolean;
    /** Whether any account here holds a secret its owner could write down. */
    hasRecoverableSecret: boolean;
    /** Whether this page was opened by another window it could answer. */
    hasOpener: boolean;
    /** Whether this page was launched from an iOS Home Screen icon. */
    isHomeScreenApp: boolean;
    /** The `Language` picked in the wallet's settings here, if any. */
    language?: number;
    newOrigin: string;
}

const forwardTarget = (input: MigrationRouteInput): string =>
    `${input.newOrigin}${input.pathname}${input.search}${input.hash}`;

/**
 * Where the new origin hears whether this profile has wallets: `#found` offers
 * the move, `#none` notes that there is nothing here and stops asking. Neither
 * is trusted for more than that — the move itself only happens through the
 * popup, whose sender the browser vouches for.
 *
 * `#found` also carries the language picked here, because the new origin has
 * no wallet yet and so no setting of its own to show the offer in. `#none`
 * shows no screen and carries nothing.
 */
export const checkAnswerUrl = (newOrigin: string, found: boolean, language?: number): string => {
    if (!found) {
        return `${newOrigin}${MIGRATE_PATH}#none`;
    }

    return language === undefined
        ? `${newOrigin}${MIGRATE_PATH}#found`
        : `${newOrigin}${MIGRATE_PATH}#found&lang=${language}`;
};

/**
 * Where "Move my wallets" goes: the new origin's offer to open the popup. It
 * opens the same screen as `#found`, under its own fragment so the new origin
 * can tell a click here from an answer to its own check.
 */
export const moveOfferUrl = (newOrigin: string, language?: number): string =>
    language === undefined
        ? `${newOrigin}${MIGRATE_PATH}#move`
        : `${newOrigin}${MIGRATE_PATH}#move&lang=${language}`;

/**
 * Conditions are evaluated top to bottom and the first match wins. The check
 * outranks everything, so a deeplink that also carries `#check` is answered
 * rather than forwarded with the question attached.
 */
export const resolveMigrationScreen = (input: MigrationRouteInput): MigrationScreen => {
    if (input.hash === '#check') {
        return {
            kind: 'check-answer',
            target: checkAnswerUrl(input.newOrigin, input.hasWalletData, input.language)
        };
    }

    // A popup that nothing opened — a bookmark, a pasted link — has nobody to
    // answer, so it routes like any other visit.
    if (input.pathname === HANDOFF_POPUP_PATH && input.hasOpener) {
        return {
            kind: 'handoff-popup',
            hasWalletData: input.hasWalletData,
            canRecoverManually: input.hasRecoverableSecret
        };
    }

    if (FORWARDED_PATH_PREFIXES.some(prefix => input.pathname.startsWith(prefix))) {
        return { kind: 'forward-deeplink', target: forwardTarget(input) };
    }

    // Ahead of the `migrated_at` branch on purpose: handing the secrets back is
    // a way out of a handoff that failed, so it stays open after one completes.
    if (input.pathname.startsWith(MANUAL_RECOVERY_PATH) && input.hasRecoverableSecret) {
        return { kind: 'manual-recovery' };
    }

    if (input.hasMigrated) {
        return input.isHomeScreenApp
            ? { kind: 'home-screen-moved' }
            : { kind: 'redirect', reason: 'already-migrated' };
    }

    if (input.hasWalletData) {
        return {
            kind: 'we-moved',
            canRecoverManually: input.hasRecoverableSecret,
            isHomeScreenApp: input.isHomeScreenApp
        };
    }

    return input.isHomeScreenApp
        ? { kind: 'home-screen-moved' }
        : { kind: 'redirect', reason: 'no-wallet-data' };
};

/**
 * The outcomes that are nothing but a navigation. They are taken before
 * anything renders, so the visitor sees this origin as a blank frame in the
 * wallet's own background rather than as a screen that flashes past.
 */
export const navigationTarget = (
    screen: MigrationScreen,
    newOrigin: string
): string | undefined => {
    switch (screen.kind) {
        case 'check-answer':
        case 'forward-deeplink':
            return screen.target;
        case 'redirect':
            return `${newOrigin}/`;
        default:
            return undefined;
    }
};
