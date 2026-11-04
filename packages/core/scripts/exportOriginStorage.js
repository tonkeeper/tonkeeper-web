/* eslint-disable no-console */
/**
 * Copies one origin's wallet storage into a snippet that recreates it on
 * another. `localStorage` belongs to an origin and no tool can reach across
 * that line, so testing the migration app against a real profile means running
 * JS on the origin that holds it:
 *
 *     yarn workspace @tonkeeper/core export:storage | pbcopy
 *
 * Paste that into the devtools console on the origin you want to copy *from*.
 * It prints what it found and puts a restore snippet on the clipboard; paste
 * that one into the console on your local old origin and the page reloads with
 * the same wallets.
 *
 * What travels is the storage as it stands — including the encrypted vaults,
 * which are only as safe as the password on them. Copy a profile you are
 * willing to have sitting in a clipboard and a dev-server origin; for anything
 * else, seed a throwaway wallet with `seed:legacy` instead.
 */
(() => {
    const STORAGE_PREFIX = 'tonkeeper';

    const entries = Object.keys(localStorage)
        .filter(key => key.startsWith(`${STORAGE_PREFIX}_`))
        .sort()
        .map(key => [key, localStorage.getItem(key)]);

    if (entries.length === 0) {
        console.warn(`No ${STORAGE_PREFIX}_* keys on ${location.origin} — nothing to copy.`);
        return;
    }

    const payloadOf = key => {
        const raw = entries.find(entry => entry[0] === `${STORAGE_PREFIX}_${key}`)?.[1];

        try {
            return raw ? JSON.parse(raw).payload : undefined;
        } catch {
            return undefined;
        }
    };

    const accounts = payloadOf('accounts');

    console.log(
        `${entries.length} keys on ${location.origin}, ${
            new Blob(entries.map(entry => entry[1] ?? '')).size
        } bytes`
    );

    if (Array.isArray(accounts)) {
        console.table(
            accounts.map(account => ({
                type: account?.type,
                name: account?.name,
                auth: account?.auth?.kind ?? '—',
                wallets:
                    account?.tonWallets?.length ?? account?.allAvailableDerivations?.length ?? 0
            }))
        );
    } else {
        console.warn('No accounts key — this profile reads as "nothing to move".');
    }

    const snippet = `${entries
        .map(
            ([key, value]) =>
                `localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(value)});`
        )
        .join('\n')}\nlocation.reload();\n`;

    // `copy` exists only when this runs from the console, which is the only
    // place it is meant to run; the clipboard API needs the page focused and
    // silently rejects while devtools has focus.
    if (typeof copy === 'function') {
        copy(snippet);
        console.log('Restore snippet copied — paste it into the console on the old origin.');
    } else {
        console.log(snippet);
    }
})();
