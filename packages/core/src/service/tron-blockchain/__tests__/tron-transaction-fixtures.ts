import { AbiCoder, getBytes, hexlify, sha256, toUtf8Bytes } from 'ethers';

import { evmHexFromTronAddress } from '../tron-transaction';

export const OWNER = 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH';
export const RECIPIENT = 'TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP';
export const USDT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

const TRANSFER_TYPE_URL = 'type.googleapis.com/protocol.TransferContract';
const TRIGGER_TYPE_URL = 'type.googleapis.com/protocol.TriggerSmartContract';

const varint = (value: bigint): number[] => {
    const out: number[] = [];
    let rest = value;
    while (rest >= 0x80n) {
        out.push(Number(rest & 0x7fn) | 0x80);
        rest >>= 7n;
    }
    out.push(Number(rest));
    return out;
};

/** A varint field. */
export const vf = (number: number, value: bigint | number): number[] => [
    ...varint(BigInt(number << 3)),
    ...varint(BigInt(value))
];

/** A length-delimited field. */
export const lf = (number: number, bytes: Uint8Array | number[]): number[] => [
    ...varint(BigInt((number << 3) | 2)),
    ...varint(BigInt(bytes.length)),
    ...bytes
];

export const addressBytes = (address: string): number[] => [
    0x41,
    ...getBytes(evmHexFromTronAddress(address))
];

export const transferValue = (owner: string, to: string, amount: bigint): number[] => [
    ...lf(1, addressBytes(owner)),
    ...lf(2, addressBytes(to)),
    ...vf(3, amount)
];

export const triggerValue = (
    owner: string,
    contract: string,
    data: string,
    extra: number[] = []
): number[] => [
    ...lf(1, addressBytes(owner)),
    ...lf(2, addressBytes(contract)),
    ...lf(4, getBytes(`0x${data}`)),
    ...extra
];

export const contract = (
    type: number,
    typeUrl: string,
    value: number[],
    extra: number[] = []
): number[] => [
    ...vf(1, type),
    ...lf(2, [...lf(1, toUtf8Bytes(typeUrl)), ...lf(2, value)]),
    ...extra
];

export const transferContract = (owner = OWNER, to = RECIPIENT, amount = 1_000_000n) =>
    contract(1, TRANSFER_TYPE_URL, transferValue(owner, to, amount));

export const triggerContract = (data: string, owner = OWNER, extra: number[] = []) =>
    contract(31, TRIGGER_TYPE_URL, triggerValue(owner, USDT, data, extra));

export const rawData = (contracts: number[][], extra: number[] = []): number[] => [
    ...lf(1, [0xab, 0xcd]),
    ...lf(4, [1, 2, 3, 4, 5, 6, 7, 8]),
    ...vf(8, 1_700_000_600_000),
    ...contracts.flatMap(c => lf(11, c)),
    ...vf(14, 1_700_000_000_000),
    ...extra
];

/** A transaction whose `txID` is the hash of its raw data, as a node returns it. */
export const tronTransaction = (raw: number[]) => ({
    visible: false,
    txID: sha256(new Uint8Array(raw)).slice(2),
    raw_data: {},
    raw_data_hex: hexlify(new Uint8Array(raw)).slice(2)
});

export const trc20Data = (selector: string, types: string[], values: unknown[]): string =>
    selector + AbiCoder.defaultAbiCoder().encode(types, values).slice(2);

export const evmFormOf = (address: string): string => evmHexFromTronAddress(address);
