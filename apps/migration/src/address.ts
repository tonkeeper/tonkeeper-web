/**
 * The wallet stores raw `0:<hex>` addresses; their owner has only ever seen the
 * friendly base64 form. The conversion is restated here rather than imported
 * for the same reason as the storage keys — this app builds without
 * `@tonkeeper/core`, so that no wallet code can reach the bundle served on this
 * origin.
 */

/** Wallet addresses are shown non-bounceable, as `formatAddress` does. */
const TAG_NON_BOUNCEABLE = 0x51;
const TAG_TEST_ONLY = 0x80;

const RAW_ADDRESS_PATTERN = /^(-?\d+):([0-9a-f]{64})$/i;

/** CRC16-CCITT (XModem), the checksum a friendly address ends with. */
const crc16 = (data: Uint8Array): number => {
    let crc = 0;

    for (const byte of data) {
        crc ^= byte << 8;

        for (let bit = 0; bit < 8; bit++) {
            crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff;
        }
    }

    return crc;
};

const toBase64Url = (bytes: Uint8Array): string => {
    let binary = '';

    for (const byte of bytes) {
        binary += String.fromCharCode(byte);
    }

    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_');
};

/** `undefined` for anything that isn't a raw TON address, which is not shown. */
export const toFriendlyAddress = (rawAddress: string, testnet = false): string | undefined => {
    const match = RAW_ADDRESS_PATTERN.exec(rawAddress);

    if (!match) {
        return undefined;
    }

    const [, workchain, hash] = match;

    const tagged = new Uint8Array(34);
    tagged[0] = TAG_NON_BOUNCEABLE | (testnet ? TAG_TEST_ONLY : 0);
    tagged[1] = Number(workchain) & 0xff;

    for (let i = 0; i < 32; i++) {
        tagged[2 + i] = parseInt(hash.slice(i * 2, i * 2 + 2), 16);
    }

    const checksum = crc16(tagged);

    const address = new Uint8Array(36);
    address.set(tagged);
    address[34] = checksum >> 8;
    address[35] = checksum & 0xff;

    return toBase64Url(address);
};

export const toShortAddress = (value: string, length = 4): string =>
    value.length > length * 2 ? `${value.slice(0, length)}…${value.slice(-length)}` : value;
