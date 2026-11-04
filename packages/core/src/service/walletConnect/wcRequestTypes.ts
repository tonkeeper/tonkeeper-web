import { inspectTronTransaction } from '../tron-blockchain/tron-transaction';
import { WalletConnectNetwork, networkOfCaipChain } from './wcChains';

export interface WalletConnectVerification {
    origin: string;
    validation: 'VALID' | 'INVALID' | 'UNKNOWN';
    isScam: boolean;
}

export interface WalletConnectEvmTransaction {
    from?: string;
    to?: string;
    value?: string;
    data?: string;
    gas?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: string;
}

export interface Eip712TypedData {
    types: Record<string, { name: string; type: string }[]>;
    primaryType: string;
    domain: Record<string, unknown>;
    message: Record<string, unknown>;
}

interface WalletConnectRequestBase {
    topic: string;
    id: number;
    network: WalletConnectNetwork;
    caipChain: string;
    /** Address the dApp addressed the request to, as sent (not normalized). */
    address: string;
    verification?: WalletConnectVerification;
}

export type WalletConnectRequestPayload = WalletConnectRequestBase &
    (
        | { kind: 'personal_sign'; message: string }
        | { kind: 'eth_signTypedData_v4'; typedData: Eip712TypedData }
        | { kind: 'eth_signTransaction'; transaction: WalletConnectEvmTransaction }
        | { kind: 'eth_sendTransaction'; transaction: WalletConnectEvmTransaction }
        | { kind: 'tron_signMessage'; message: string }
        | { kind: 'tron_signTransaction'; transaction: Record<string, unknown> }
    );

export type WalletConnectRequestKind = WalletConnectRequestPayload['kind'];

export type DecodeSessionRequestError =
    | 'unsupported_method'
    | 'unsupported_chain'
    | 'invalid_params';

export interface SessionRequestLike {
    id: number;
    topic: string;
    params: {
        request: { method: string; params: unknown };
        chainId: string;
    };
    verifyContext?: {
        verified: { origin: string; validation: 'VALID' | 'INVALID' | 'UNKNOWN'; isScam?: boolean };
    };
}

const asRecord = (value: unknown): Record<string, unknown> | null =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : null;

const asString = (value: unknown): string | null => (typeof value === 'string' ? value : null);

/**
 * `undefined` when the domain carries no chain id (the signer then leaves it
 * out of the domain separator too), `null` when the value isn't a chain id.
 */
const parseDomainChainId = (value: unknown): bigint | null | undefined => {
    if (value === undefined || value === null) return undefined;
    if (typeof value === 'number') {
        return Number.isSafeInteger(value) && value >= 0 ? BigInt(value) : null;
    }
    if (typeof value === 'string' && /^(0x[0-9a-f]+|[0-9]+)$/i.test(value)) {
        return BigInt(value);
    }
    return null;
};

/**
 * The domain decides where the signature is valid, so a chain id that names a
 * different chain than the one the request came in on is refused.
 */
const domainChainMatches = (domain: Record<string, unknown>, caipChain: string): boolean => {
    const chainId = parseDomainChainId(domain.chainId);
    if (chainId === undefined) return true;
    return chainId !== null && chainId === BigInt(caipChain.split(':')[1]);
};

/**
 * TRON methods arrive either positionally or as `{address, message |
 * transaction}` objects depending on the dApp library; both are accepted.
 */
const tronParams = (
    params: unknown
): { address: string | null; message: unknown; transaction: unknown } => {
    const record = asRecord(Array.isArray(params) ? params[0] : params);
    return {
        address: asString(record?.address),
        message: record?.message,
        transaction: record?.transaction
    };
};

/**
 * Refused up front: the signature would not commit to the bytes the confirm
 * sheet reads, or the transaction is sent from an account other than the one
 * the request is addressed to, which the signer refuses after unlock anyway.
 */
const isSignableTronTransaction = (
    transaction: Record<string, unknown>,
    address: string
): boolean => {
    try {
        return inspectTronTransaction(transaction).owner === address.trim();
    } catch (e) {
        return false;
    }
};

export const decodeSessionRequest = (
    event: SessionRequestLike
):
    | { ok: true; payload: WalletConnectRequestPayload }
    | { ok: false; error: DecodeSessionRequestError } => {
    const network = networkOfCaipChain(event.params.chainId);
    if (network === undefined) {
        return { ok: false, error: 'unsupported_chain' };
    }

    const verified = event.verifyContext?.verified;
    const base = {
        topic: event.topic,
        id: event.id,
        network,
        caipChain: event.params.chainId,
        verification: verified
            ? {
                  origin: verified.origin,
                  validation: verified.validation,
                  isScam: verified.isScam === true
              }
            : undefined
    };

    const { method, params } = event.params.request;

    switch (method) {
        case 'personal_sign': {
            if (!Array.isArray(params)) {
                return { ok: false, error: 'invalid_params' };
            }
            const [message, address] = [asString(params[0]), asString(params[1])];
            if (message === null || address === null) {
                return { ok: false, error: 'invalid_params' };
            }
            return { ok: true, payload: { ...base, kind: 'personal_sign', address, message } };
        }
        case 'eth_signTypedData_v4': {
            if (!Array.isArray(params)) {
                return { ok: false, error: 'invalid_params' };
            }
            const address = asString(params[0]);
            const rawTypedData =
                asString(params[1]) ?? (asRecord(params[1]) ? JSON.stringify(params[1]) : null);
            if (address === null || rawTypedData === null) {
                return { ok: false, error: 'invalid_params' };
            }
            let typedData: Eip712TypedData;
            try {
                typedData = JSON.parse(rawTypedData);
            } catch (e) {
                return { ok: false, error: 'invalid_params' };
            }
            const domain = asRecord(typedData?.domain);
            if (
                !asRecord(typedData?.types) ||
                typeof typedData.primaryType !== 'string' ||
                domain === null
            ) {
                return { ok: false, error: 'invalid_params' };
            }
            if (!domainChainMatches(domain, event.params.chainId)) {
                return { ok: false, error: 'unsupported_chain' };
            }
            return {
                ok: true,
                payload: { ...base, kind: 'eth_signTypedData_v4', address, typedData }
            };
        }
        case 'eth_signTransaction':
        case 'eth_sendTransaction': {
            const transaction = asRecord(Array.isArray(params) ? params[0] : params);
            const from = asString(transaction?.from);
            if (transaction === null || from === null) {
                return { ok: false, error: 'invalid_params' };
            }
            return {
                ok: true,
                payload: {
                    ...base,
                    kind: method,
                    address: from,
                    transaction: transaction as WalletConnectEvmTransaction
                }
            };
        }
        case 'tron_signMessage': {
            const { address, message } = tronParams(params);
            const text = asString(message);
            if (address === null || text === null) {
                return { ok: false, error: 'invalid_params' };
            }
            return {
                ok: true,
                payload: { ...base, kind: 'tron_signMessage', address, message: text }
            };
        }
        case 'tron_signTransaction': {
            const { address, transaction } = tronParams(params);
            const record = asRecord(transaction);
            if (
                address === null ||
                record === null ||
                !isSignableTronTransaction(record, address)
            ) {
                return { ok: false, error: 'invalid_params' };
            }
            return {
                ok: true,
                payload: { ...base, kind: 'tron_signTransaction', address, transaction: record }
            };
        }
        default:
            return { ok: false, error: 'unsupported_method' };
    }
};
