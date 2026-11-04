/* eslint-disable import/no-extraneous-dependencies */
import { describe, expect, it } from 'vitest';

import {
    HANDOFF_POPUP_PATH,
    navigationTarget,
    MANUAL_RECOVERY_PATH,
    MigrationRouteInput,
    moveOfferUrl,
    resolveMigrationScreen
} from './routing';

const NEW_ORIGIN = 'https://web.keeperwallet.com';

const visit = (input: Partial<MigrationRouteInput>): MigrationRouteInput => ({
    pathname: '/',
    search: '',
    hash: '',
    hasWalletData: false,
    hasMigrated: false,
    hasRecoverableSecret: false,
    hasOpener: false,
    isHomeScreenApp: false,
    newOrigin: NEW_ORIGIN,
    ...input
});

describe('opening the old origin directly', () => {
    it('redirects a profile with nothing on it', () => {
        expect(resolveMigrationScreen(visit({}))).toEqual({
            kind: 'redirect',
            reason: 'no-wallet-data'
        });
    });

    it('offers the move when wallets are still here', () => {
        expect(resolveMigrationScreen(visit({ hasWalletData: true }))).toEqual({
            kind: 'we-moved',
            canRecoverManually: false,
            isHomeScreenApp: false
        });
    });

    it('offers the manual way out only when a secret is here to hand back', () => {
        const withSecret = visit({ hasWalletData: true, hasRecoverableSecret: true });

        expect(resolveMigrationScreen(withSecret)).toEqual({
            kind: 'we-moved',
            canRecoverManually: true,
            isHomeScreenApp: false
        });
    });

    it('redirects without a payload once the handoff has been done', () => {
        const migrated = visit({ hasWalletData: true, hasMigrated: true });

        expect(resolveMigrationScreen(migrated)).toEqual({
            kind: 'redirect',
            reason: 'already-migrated'
        });
    });
});

describe('opening the old origin from a Home Screen icon', () => {
    it('says how to replace the icon instead of redirecting', () => {
        const empty = visit({ isHomeScreenApp: true });
        const migrated = visit({ isHomeScreenApp: true, hasWalletData: true, hasMigrated: true });

        expect(resolveMigrationScreen(empty)).toEqual({ kind: 'home-screen-moved' });
        expect(resolveMigrationScreen(migrated)).toEqual({ kind: 'home-screen-moved' });
        expect(navigationTarget({ kind: 'home-screen-moved' }, NEW_ORIGIN)).toBeUndefined();
    });

    it('still offers the move, with the icon hint', () => {
        expect(
            resolveMigrationScreen(visit({ isHomeScreenApp: true, hasWalletData: true }))
        ).toMatchObject({ kind: 'we-moved', isHomeScreenApp: true });
    });

    it('still answers the check and forwards deeplinks', () => {
        expect(
            resolveMigrationScreen(visit({ isHomeScreenApp: true, hash: '#check' }))
        ).toMatchObject({ kind: 'check-answer' });
        expect(
            resolveMigrationScreen(visit({ isHomeScreenApp: true, pathname: '/ton-connect' }))
        ).toMatchObject({ kind: 'forward-deeplink' });
    });
});

describe('answering the check', () => {
    it('says wallets are here, and nothing more', () => {
        expect(resolveMigrationScreen(visit({ hash: '#check', hasWalletData: true }))).toEqual({
            kind: 'check-answer',
            target: `${NEW_ORIGIN}/migrate#found`
        });
    });

    it('says nothing is here', () => {
        expect(resolveMigrationScreen(visit({ hash: '#check' }))).toEqual({
            kind: 'check-answer',
            target: `${NEW_ORIGIN}/migrate#none`
        });
    });

    it('carries the language picked here along with a found answer', () => {
        const withLanguage = visit({ hash: '#check', hasWalletData: true, language: 1 });

        expect(resolveMigrationScreen(withLanguage)).toMatchObject({
            target: `${NEW_ORIGIN}/migrate#found&lang=1`
        });
    });

    it('carries nothing with a none answer', () => {
        expect(resolveMigrationScreen(visit({ hash: '#check', language: 1 }))).toMatchObject({
            target: `${NEW_ORIGIN}/migrate#none`
        });
    });

    it('still answers after a handoff, so a failed import can re-pull', () => {
        const retry = visit({ hash: '#check', hasWalletData: true, hasMigrated: true });

        expect(resolveMigrationScreen(retry)).toMatchObject({
            target: `${NEW_ORIGIN}/migrate#found`
        });
    });
});

// The same offer as `#found`, under its own fragment, so the new origin can
// tell this click from an answer to its check.
describe('moving from the we-moved screen', () => {
    it('opens the offer as #move, with the language picked here', () => {
        expect(moveOfferUrl(NEW_ORIGIN)).toBe(`${NEW_ORIGIN}/migrate#move`);
        expect(moveOfferUrl(NEW_ORIGIN, 1)).toBe(`${NEW_ORIGIN}/migrate#move&lang=1`);
    });
});

describe('the handoff popup', () => {
    const popup = { pathname: HANDOFF_POPUP_PATH, hasOpener: true };

    it('opens when another window opened it', () => {
        expect(
            resolveMigrationScreen(
                visit({ ...popup, hasWalletData: true, hasRecoverableSecret: true })
            )
        ).toEqual({ kind: 'handoff-popup', hasWalletData: true, canRecoverManually: true });
    });

    it('opens with nothing to send, so it can say so to its opener', () => {
        expect(resolveMigrationScreen(visit(popup))).toMatchObject({
            kind: 'handoff-popup',
            hasWalletData: false
        });
    });

    it('stays open after a handoff, so a failed import can re-pull', () => {
        const retry = visit({ ...popup, hasWalletData: true, hasMigrated: true });

        expect(resolveMigrationScreen(retry)).toMatchObject({ kind: 'handoff-popup' });
    });

    it('routes like any visit when nothing opened it', () => {
        const direct = visit({ pathname: HANDOFF_POPUP_PATH, hasWalletData: true });

        expect(resolveMigrationScreen(direct)).toMatchObject({ kind: 'we-moved' });
    });
});

describe('recovering by hand', () => {
    const recover = { pathname: MANUAL_RECOVERY_PATH };

    it('opens the recovery screen for a profile holding a secret', () => {
        const withSecret = visit({ ...recover, hasWalletData: true, hasRecoverableSecret: true });

        expect(resolveMigrationScreen(withSecret)).toEqual({ kind: 'manual-recovery' });
    });

    it('stays open after a handoff, for an import that did not take', () => {
        const migrated = visit({
            ...recover,
            hasWalletData: true,
            hasRecoverableSecret: true,
            hasMigrated: true
        });

        expect(resolveMigrationScreen(migrated)).toEqual({ kind: 'manual-recovery' });
    });

    it('falls through for a profile with nothing to hand back', () => {
        const watchOnly = visit({ ...recover, hasWalletData: true });

        expect(resolveMigrationScreen(watchOnly)).toMatchObject({ kind: 'we-moved' });
    });

    it('answers the check before opening it', () => {
        const check = visit({ ...recover, hash: '#check', hasWalletData: true });

        expect(resolveMigrationScreen(check)).toMatchObject({ kind: 'check-answer' });
    });
});

describe('forwarding what other apps still point here', () => {
    it.each(['/ton-connect', '/wc', '/signer'])('forwards %s with its query intact', pathname => {
        const deeplink = visit({ pathname, search: '?v=2&id=abc', hash: '#tail' });

        expect(resolveMigrationScreen(deeplink)).toEqual({
            kind: 'forward-deeplink',
            target: `${NEW_ORIGIN}${pathname}?v=2&id=abc#tail`
        });
    });

    it('answers a deeplink that also carries the check', () => {
        const both = visit({ pathname: '/ton-connect', hash: '#check', hasWalletData: true });

        expect(resolveMigrationScreen(both)).toMatchObject({ kind: 'check-answer' });
    });

    it('leaves an unrelated path to the conditions below', () => {
        expect(resolveMigrationScreen(visit({ pathname: '/wallet' }))).toEqual({
            kind: 'redirect',
            reason: 'no-wallet-data'
        });
    });
});

describe('outcomes that are only a navigation', () => {
    it.each([
        [visit({ hash: '#check' }), `${NEW_ORIGIN}/migrate#none`],
        [visit({ pathname: '/ton-connect', search: '?v=2' }), `${NEW_ORIGIN}/ton-connect?v=2`],
        [visit({}), `${NEW_ORIGIN}/`],
        [visit({ hasWalletData: true, hasMigrated: true }), `${NEW_ORIGIN}/`]
    ])('leave before anything renders: %#', (input, target) => {
        expect(navigationTarget(resolveMigrationScreen(input), NEW_ORIGIN)).toBe(target);
    });

    it.each([
        visit({ hasWalletData: true }),
        visit({ pathname: HANDOFF_POPUP_PATH, hasOpener: true }),
        visit({ pathname: MANUAL_RECOVERY_PATH, hasWalletData: true, hasRecoverableSecret: true })
    ])('render a screen otherwise: %#', input => {
        expect(navigationTarget(resolveMigrationScreen(input), NEW_ORIGIN)).toBeUndefined();
    });
});
