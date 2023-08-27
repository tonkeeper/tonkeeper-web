import { AbiCoder, decodeBase58, encodeBase58, ethers, sha256 } from 'ethers';
export const ADDRESS_PREFIX_REGEX = /^(41)/;

export const TronAddress = {
    hexToBase58(address: string): string {
        const tronAddressPayload = '0x41' + address.slice(2);
        const checkSumTail = sha256(sha256(tronAddressPayload)).slice(2, 10);
        return encodeBase58(tronAddressPayload + checkSumTail);
    },
    base58ToHex(address: string): string {
        const decoded = decodeBase58(address).toString(16);
        return decoded.slice(0, -8);
    }
};

export function keccak256(value: string) {
    if (!value.startsWith('0x')) {
        return ethers.keccak256(ethers.toUtf8Bytes(value));
    }
    return ethers.keccak256(value);
}

export function encodeTronParams(types: string[], values: unknown[]) {
    for (let i = 0; i < types.length; i++) {
        if (types[i] === 'address') {
            values[i] = TronAddress.base58ToHex(values[i] as string).replace(
                ADDRESS_PREFIX_REGEX,
                '0x'
            );
        }
    }

    return new AbiCoder().encode(types, values);
}

export function encodePackedBytes(values: string[]) {
    return '0x' + values.map(x => x.replace('0x', '')).join('');
}
