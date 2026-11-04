/**
 * The wallet-colour palette. Each entry is a stable id (what gets stored
 * per account) plus the hex the avatar circle is filled with.
 *
 * These are raw hex rather than theme tokens on purpose: they carry no
 * semantic role and don't change between themes — they are a fixed set of
 * user-pickable accents, and the design library defines them as plain
 * fills, not variables.
 */
export interface WalletColor {
    id: string;
    /** Design-library name, shown in the picker's accessible label. */
    name: string;
    hex: string;
}

export const WALLET_COLORS: readonly WalletColor[] = [
    { id: 'steelGray', name: 'Steel Gray', hex: '#293342' },
    { id: 'lightSteelGray', name: 'Light Steel Gray', hex: '#424C5C' },
    { id: 'gray', name: 'Gray', hex: '#9DA2A4' },
    { id: 'lightRed', name: 'Light Red', hex: '#FFB585' },
    { id: 'lightOrange', name: 'Light Orange', hex: '#FFA970' },
    { id: 'lightYellow', name: 'Light Yellow', hex: '#FFC95C' },
    { id: 'lightGreen', name: 'Light Green', hex: '#85CC7A' },
    { id: 'lightBlue', name: 'Light Blue', hex: '#70A0FF' },
    { id: 'lightAquamarine', name: 'Light Aquamarine', hex: '#6CCCF5' },
    { id: 'lightPurple', name: 'Light Purple', hex: '#AD89F5' },
    { id: 'lightViolet', name: 'Light Violet', hex: '#F57FF5' },
    { id: 'lightMagenta', name: 'Light Magenta', hex: '#F576B1' },
    { id: 'lightFireOrange', name: 'Light Fire Orange', hex: '#F57F87' },
    { id: 'red', name: 'Red', hex: '#FF5252' },
    { id: 'orange', name: 'Orange', hex: '#FF8B3D' },
    { id: 'yellow', name: 'Yellow', hex: '#FFB92E' },
    { id: 'green', name: 'Green', hex: '#69CC5A' },
    { id: 'blue', name: 'Blue', hex: '#5288FF' },
    { id: 'aquamarine', name: 'Aquamarine', hex: '#47C8FF' },
    { id: 'purple', name: 'Purple', hex: '#925CFF' },
    { id: 'violet', name: 'Violet', hex: '#FF5CFF' },
    { id: 'magenta', name: 'Magenta', hex: '#FF479D' },
    { id: 'fireOrange', name: 'Fire Orange', hex: '#FF525D' }
];

export const walletColorById = (id: string | undefined): WalletColor | undefined =>
    id === undefined ? undefined : WALLET_COLORS.find(c => c.id === id);

/**
 * Colour for an account that has never been assigned one. Every wallet in
 * the design library carries a colour — there is no uncoloured state — so
 * an unset account falls back to a palette entry picked from its id rather
 * than to a neutral circle. Same id always yields the same colour, so the
 * assignment is stable across reloads and devices without needing to be
 * written to storage.
 */
export const defaultWalletColor = (accountId: string): WalletColor => {
    let hash = 0;
    for (let i = 0; i < accountId.length; i++) {
        hash = (hash * 31 + accountId.charCodeAt(i)) | 0;
    }
    return WALLET_COLORS[Math.abs(hash) % WALLET_COLORS.length];
};
