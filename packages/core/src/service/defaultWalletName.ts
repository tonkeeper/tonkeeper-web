/**
 * Default-name suggestion for a new wallet/account, ported from the
 * native apps' `DefaultWalletName.suggest` (iOS and Android share the
 * algorithm): the first wallet gets the plain base, later ones get
 * `base N` where N continues from the highest index already taken.
 *
 * A label counts toward the index when it is either an exact
 * case-insensitive match of the base (index 1), or `base + ' ' + digits`
 * with a non-empty all-ASCII-digit suffix and no leading zero — so
 * `Wallet v4R2`, `Wallet 2x`, `Wallet 1.5`, `Wallet 007`, and
 * non-ASCII numerals are ignored. Freed indexes are not reused:
 * `Wallet` + `Wallet 5` suggests `Wallet 6`.
 */
export function suggestWalletName(base: string, existingLabels: string[]): string {
    const name = base.trim();
    if (name === '') return base;

    let maxIndex = 0;
    for (const label of existingLabels) {
        const index = matchIndex(label.trim(), name);
        if (index !== null && index > maxIndex) {
            maxIndex = index;
        }
    }

    if (maxIndex < 1 || !Number.isSafeInteger(maxIndex + 1)) return name;
    return `${name} ${maxIndex + 1}`;
}

function matchIndex(label: string, base: string): number | null {
    if (label.toLowerCase() === base.toLowerCase()) return 1;

    const prefix = `${base} `;
    if (!label.toLowerCase().startsWith(prefix.toLowerCase())) return null;

    const suffix = label.slice(prefix.length);
    if (suffix === '' || suffix.startsWith('0') || !/^[0-9]+$/.test(suffix)) return null;

    const index = Number(suffix);
    return Number.isSafeInteger(index) ? index : null;
}
