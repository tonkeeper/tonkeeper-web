import { decodeBase58, encodeBase58, getBytes, hexlify, sha256, toBeHex } from 'ethers';

/**
 * The contracts this wallet decodes, read out of `raw_data_hex`. Addresses
 * are base58check; `data` is lowercase hex without a `0x` prefix.
 */
export type TronContract =
    | { type: 'transfer'; owner: string; to: string; amount: bigint }
    | {
          type: 'triggerSmartContract';
          owner: string;
          contract: string;
          callValue: bigint;
          data: string;
      };

export interface TronTransactionContents {
    contract: TronContract;
    /** Sun; zero when the transaction sets none. */
    feeLimit: bigint;
}

export interface TronTransactionInspection {
    /** The `owner_address` every contract type carries as its first field. */
    owner: string;
    /** The protocol name of the contract type, e.g. `FreezeBalanceV2Contract`. */
    contractType: string;
    /** `undefined` when the contract is not one {@link TronContract} models. */
    contract: TronContract | undefined;
    /**
     * The transaction carries fields {@link contract} does not show: a
     * `Permission_id`, a TRC10 token attached to a call, or anything else
     * outside the modelled fields.
     */
    hasUnreadFields: boolean;
    /** Sun; zero when the transaction sets none. */
    feeLimit: bigint;
}

export class TronTransactionContentsError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'TronTransactionContentsError';
    }
}

function fail(message: string): never {
    throw new TronTransactionContentsError(message);
}

const TRON_ADDRESS_PREFIX = 0x41;

const RAW_CONTRACT = 11;
const RAW_FEE_LIMIT = 18;

const CONTRACT_TYPE = 1;
const CONTRACT_PARAMETER = 2;

const ANY_TYPE_URL = 1;
const ANY_VALUE = 2;

const TRANSFER_CONTRACT = 1;
const TRIGGER_SMART_CONTRACT = 31;

/** `Transaction.Contract.ContractType` of the TRON protocol. */
const CONTRACT_TYPE_NAMES: Record<number, string> = {
    0: 'AccountCreateContract',
    1: 'TransferContract',
    2: 'TransferAssetContract',
    3: 'VoteAssetContract',
    4: 'VoteWitnessContract',
    5: 'WitnessCreateContract',
    6: 'AssetIssueContract',
    8: 'WitnessUpdateContract',
    9: 'ParticipateAssetIssueContract',
    10: 'AccountUpdateContract',
    11: 'FreezeBalanceContract',
    12: 'UnfreezeBalanceContract',
    13: 'WithdrawBalanceContract',
    14: 'UnfreezeAssetContract',
    15: 'UpdateAssetContract',
    16: 'ProposalCreateContract',
    17: 'ProposalApproveContract',
    18: 'ProposalDeleteContract',
    19: 'SetAccountIdContract',
    20: 'CustomContract',
    30: 'CreateSmartContract',
    31: 'TriggerSmartContract',
    32: 'GetContract',
    33: 'UpdateSettingContract',
    41: 'ExchangeCreateContract',
    42: 'ExchangeInjectContract',
    43: 'ExchangeWithdrawContract',
    44: 'ExchangeTransactionContract',
    45: 'UpdateEnergyLimitContract',
    46: 'AccountPermissionUpdateContract',
    48: 'ClearABIContract',
    49: 'UpdateBrokerageContract',
    51: 'ShieldedTransferContract',
    52: 'MarketSellAssetContract',
    53: 'MarketCancelOrderContract',
    54: 'FreezeBalanceV2Contract',
    55: 'UnfreezeBalanceV2Contract',
    56: 'WithdrawExpireUnfreezeContract',
    57: 'DelegateResourceContract',
    58: 'UnDelegateResourceContract',
    59: 'CancelAllUnfreezeV2Contract'
};

const typeUrlOf = (name: string) => `type.googleapis.com/protocol.${name}`;

const WIRE_VARINT = 0;
const WIRE_FIXED64 = 1;
const WIRE_LENGTH_DELIMITED = 2;
const WIRE_FIXED32 = 5;

const MAX_UINT64 = 2n ** 64n - 1n;

interface ProtoField {
    number: number;
    wireType: number;
    varint?: bigint;
    bytes?: Uint8Array;
}

const readVarint = (bytes: Uint8Array, start: number): [bigint, number] => {
    let result = 0n;
    let shift = 0n;
    let position = start;
    for (;;) {
        if (position >= bytes.length) fail('Truncated varint');
        const byte = bytes[position++];
        result |= BigInt(byte & 0x7f) << shift;
        if ((byte & 0x80) === 0) break;
        shift += 7n;
        if (shift >= 70n) fail('Varint too long');
    }
    if (result > MAX_UINT64) fail('Varint out of range');
    return [result, position];
};

const scanFields = (bytes: Uint8Array): ProtoField[] => {
    const fields: ProtoField[] = [];
    let position = 0;
    while (position < bytes.length) {
        const [key, afterKey] = readVarint(bytes, position);
        position = afterKey;
        const number = Number(key >> 3n);
        const wireType = Number(key & 7n);
        if (number === 0) fail('Invalid field number');
        switch (wireType) {
            case WIRE_VARINT: {
                const [varint, next] = readVarint(bytes, position);
                position = next;
                fields.push({ number, wireType, varint });
                break;
            }
            case WIRE_LENGTH_DELIMITED: {
                const [length, next] = readVarint(bytes, position);
                if (length > BigInt(bytes.length - next)) fail('Truncated field');
                const end = next + Number(length);
                fields.push({ number, wireType, bytes: bytes.subarray(next, end) });
                position = end;
                break;
            }
            case WIRE_FIXED64:
            case WIRE_FIXED32: {
                const end = position + (wireType === WIRE_FIXED64 ? 8 : 4);
                if (end > bytes.length) fail('Truncated field');
                fields.push({ number, wireType, bytes: bytes.subarray(position, end) });
                position = end;
                break;
            }
            default:
                fail('Unsupported wire type');
        }
    }
    return fields;
};

/**
 * A protobuf message read field by field, strict about a repeated field
 * where one is expected.
 */
class ProtoMessage {
    private readonly fields: ProtoField[];

    constructor(bytes: Uint8Array) {
        this.fields = scanFields(bytes);
    }

    count(number: number): number {
        return this.fields.filter(f => f.number === number).length;
    }

    hasOnly(allowed: readonly number[]): boolean {
        return this.fields.every(f => allowed.includes(f.number));
    }

    /**
     * Protobuf resolves a repeated scalar last-wins, but no builder emits
     * one, so guessing which copy the signature describes is refused.
     */
    private field(number: number): ProtoField | undefined {
        const matches = this.fields.filter(f => f.number === number);
        if (matches.length > 1) fail('Repeated field');
        return matches[0];
    }

    varint(number: number): bigint {
        const field = this.field(number);
        if (field === undefined) return 0n;
        if (field.varint === undefined) fail('Unexpected wire type');
        return field.varint;
    }

    bytes(number: number): Uint8Array | undefined {
        const field = this.field(number);
        if (field === undefined) return undefined;
        if (field.wireType !== WIRE_LENGTH_DELIMITED) fail('Unexpected wire type');
        return field.bytes;
    }

    message(number: number): ProtoMessage {
        const bytes = this.bytes(number);
        if (bytes === undefined) fail('Missing message');
        return new ProtoMessage(bytes);
    }
}

const tronBase58FromPayload = (payload: Uint8Array): string => {
    const checksum = getBytes(sha256(sha256(payload))).subarray(0, 4);
    const full = new Uint8Array(payload.length + 4);
    full.set(payload);
    full.set(checksum, payload.length);
    return encodeBase58(full);
};

const addressOf = (bytes: Uint8Array | undefined): string => {
    if (bytes === undefined || bytes.length !== 21 || bytes[0] !== TRON_ADDRESS_PREFIX) {
        fail('Invalid address');
    }
    return tronBase58FromPayload(bytes);
};

/** The base58check TRON address of a 20-byte EVM-form (`0x…`) address. */
export const tronAddressFromEvmHex = (evmHex: string): string => {
    const body = getBytes(evmHex);
    if (body.length !== 20) fail('Invalid address');
    const payload = new Uint8Array(21);
    payload[0] = TRON_ADDRESS_PREFIX;
    payload.set(body, 1);
    return tronBase58FromPayload(payload);
};

/** The 20-byte EVM-form (`0x…`) body of a base58check TRON address. */
export const evmHexFromTronAddress = (address: string): string => {
    let decoded: Uint8Array;
    try {
        decoded = getBytes(toBeHex(decodeBase58(address), 25));
    } catch (e) {
        fail('Invalid address');
    }
    const payload = decoded.subarray(0, 21);
    if (payload[0] !== TRON_ADDRESS_PREFIX || tronBase58FromPayload(payload) !== address) {
        fail('Invalid address');
    }
    return hexlify(payload.subarray(1));
};

const hexOf = (value: unknown, label: string): string => {
    if (typeof value !== 'string') fail(`Missing ${label}`);
    const hex = value.replace(/^0x/i, '').toLowerCase();
    if (!/^([0-9a-f]{2})*$/.test(hex)) fail(`Invalid ${label}`);
    return hex;
};

/** The contract and the value field numbers it shows, or `undefined` for one not modelled. */
const decodeContract = (
    type: number,
    typeUrl: string | undefined,
    value: ProtoMessage
): { contract: TronContract; fields: number[] } | undefined => {
    if (typeUrl !== typeUrlOf(CONTRACT_TYPE_NAMES[type] ?? '')) return undefined;
    try {
        if (type === TRANSFER_CONTRACT) {
            return {
                contract: {
                    type: 'transfer',
                    owner: addressOf(value.bytes(1)),
                    to: addressOf(value.bytes(2)),
                    amount: value.varint(3)
                },
                fields: [1, 2, 3]
            };
        }
        if (type === TRIGGER_SMART_CONTRACT) {
            const data = value.bytes(4);
            return {
                contract: {
                    type: 'triggerSmartContract',
                    owner: addressOf(value.bytes(1)),
                    contract: addressOf(value.bytes(2)),
                    callValue: value.varint(3),
                    data: data === undefined ? '' : hexlify(data).slice(2)
                },
                fields: [1, 2, 3, 4]
            };
        }
    } catch (e) {
        if (!(e instanceof TronTransactionContentsError)) throw e;
    }
    return undefined;
};

/**
 * Reads a TRON transaction from `raw_data_hex` — the bytes whose hash
 * (`txID`) the key signs — never from the readable `raw_data` beside it.
 * Throws unless the `txID` is that hash, the transaction carries exactly
 * one contract (the network executes no other), and that contract names
 * its owner; any contract type is read past that.
 */
export const inspectTronTransaction = (transaction: unknown): TronTransactionInspection => {
    if (typeof transaction !== 'object' || transaction === null) {
        fail('Invalid transaction');
    }
    const { txID, raw_data_hex } = transaction as Record<string, unknown>;
    const bytes = getBytes(`0x${hexOf(raw_data_hex, 'raw data')}`);
    if (sha256(bytes).slice(2) !== hexOf(txID, 'transaction id')) {
        fail('Transaction id does not match raw data');
    }

    const rawData = new ProtoMessage(bytes);
    if (rawData.count(RAW_CONTRACT) !== 1) fail('Expected exactly one contract');
    const contract = rawData.message(RAW_CONTRACT);
    const parameter = contract.message(CONTRACT_PARAMETER);
    const value = parameter.message(ANY_VALUE);
    const owner = addressOf(value.bytes(1));

    const type = Number(contract.varint(CONTRACT_TYPE));
    const typeUrl = parameter.bytes(ANY_TYPE_URL);
    const decoded = decodeContract(
        type,
        typeUrl === undefined ? undefined : new TextDecoder().decode(typeUrl),
        value
    );

    return {
        owner,
        contractType: CONTRACT_TYPE_NAMES[type] ?? `ContractType ${type}`,
        contract: decoded?.contract,
        hasUnreadFields:
            !contract.hasOnly([CONTRACT_TYPE, CONTRACT_PARAMETER]) ||
            !parameter.hasOnly([ANY_TYPE_URL, ANY_VALUE]) ||
            (decoded !== undefined && !value.hasOnly(decoded.fields)),
        feeLimit: rawData.varint(RAW_FEE_LIMIT)
    };
};

/**
 * {@link inspectTronTransaction}, accepting only a modelled contract with
 * no fields beyond the modelled ones.
 */
export const readTronTransaction = (transaction: unknown): TronTransactionContents => {
    const { contract, hasUnreadFields, feeLimit } = inspectTronTransaction(transaction);
    if (contract === undefined) fail('Unsupported contract');
    if (hasUnreadFields) fail('Unexpected field');
    return { contract, feeLimit };
};

const sameContract = (actual: TronContract, expected: TronContract): boolean => {
    if (actual.type === 'transfer' && expected.type === 'transfer') {
        return (
            actual.owner === expected.owner &&
            actual.to === expected.to &&
            actual.amount === expected.amount
        );
    }
    if (actual.type === 'triggerSmartContract' && expected.type === 'triggerSmartContract') {
        return (
            actual.owner === expected.owner &&
            actual.contract === expected.contract &&
            actual.callValue === expected.callValue &&
            actual.data === expected.data.replace(/^0x/i, '').toLowerCase()
        );
    }
    return false;
};

/** Compares a transaction built from `expected` with it, field by field. */
export const assertTronTransactionMatches = (
    transaction: unknown,
    expected: { contract: TronContract; feeLimit: bigint }
): void => {
    const actual = readTronTransaction(transaction);
    if (
        !sameContract(actual.contract, expected.contract) ||
        actual.feeLimit !== expected.feeLimit
    ) {
        fail('Transaction does not match the request');
    }
};
