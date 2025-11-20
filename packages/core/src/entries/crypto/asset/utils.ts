import BigNumber from 'bignumber.js';

export function isInteger(val: BigNumber.Value | bigint): boolean {
    if (typeof val === 'bigint') {
        return true;
    }

    try {
        const n = new BigNumber(val);
        return n.mod(1).eq(0);
    } catch {
        return false;
    }
}

export function toBigInt(val: BigNumber.Value | bigint): bigint {
    if (typeof val === 'bigint') {
        return val;
    }

    if (!isInteger(val)) {
        throw new Error('Cannot convert non-integer value to bigint');
    }

    return BigInt(new BigNumber(val).toFixed(0));
}
