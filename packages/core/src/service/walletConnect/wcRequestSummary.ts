import { AbiCoder, getBytes, isHexString } from 'ethers';

import {
    TronContract,
    inspectTronTransaction,
    tronAddressFromEvmHex
} from '../tron-blockchain/tron-transaction';
import { WalletConnectEvmTransaction } from './wcRequestTypes';

/**
 * Allowances from this size up read as unlimited: besides max uint256, dApps
 * use max uint160 (Permit2) and max uint96 (Compound-style tokens) as their
 * "infinite" approval.
 */
const UNLIMITED_ALLOWANCE = 2n ** 96n - 1n;

export type EvmDecodedCall =
    | { method: 'approve'; spender: string; amount: bigint; unlimited: boolean }
    | { method: 'increaseAllowance'; spender: string; amount: bigint; unlimited: boolean }
    | { method: 'setApprovalForAll'; operator: string; approved: boolean }
    | { method: 'transfer'; recipient: string; amount: bigint }
    | { method: 'transferFrom'; from: string; recipient: string; amount: bigint };

export type DappTransactionSummary =
    | { kind: 'transfer'; to: string; value: bigint | undefined }
    | {
          kind: 'call';
          to: string;
          value: bigint | undefined;
          data: string;
          /** `undefined` when the selector isn't one the wallet can decode. */
          call: EvmDecodedCall | undefined;
      }
    | { kind: 'deploy'; value: bigint | undefined; data: string };

const SELECTORS: Record<string, { method: EvmDecodedCall['method']; types: string[] }> = {
    '0x095ea7b3': { method: 'approve', types: ['address', 'uint256'] },
    '0x39509351': { method: 'increaseAllowance', types: ['address', 'uint256'] },
    '0xa22cb465': { method: 'setApprovalForAll', types: ['address', 'bool'] },
    '0xa9059cbb': { method: 'transfer', types: ['address', 'uint256'] },
    '0x23b872dd': { method: 'transferFrom', types: ['address', 'address', 'uint256'] }
};

const parseQuantity = (value: string | undefined): bigint | undefined => {
    if (value === undefined) return undefined;
    try {
        return BigInt(value);
    } catch (e) {
        return undefined;
    }
};

const hasCalldata = (data: string | undefined): data is string =>
    data !== undefined && data.trim() !== '' && data.trim().toLowerCase() !== '0x';

/**
 * Decodes the calldata of the token calls whose effect the user must see
 * before signing. Arguments must fill the static ABI layout exactly; any
 * other shape is treated as undecodable rather than guessed at.
 */
export const decodeEvmCall = (data: string): EvmDecodedCall | undefined => {
    const hex = data.trim().toLowerCase();
    const entry = SELECTORS[hex.slice(0, 10)];
    if (!entry || !isHexString(hex) || hex.length !== 10 + entry.types.length * 64) {
        return undefined;
    }
    // ethers defers a malformed argument's decode error until that argument
    // is read, so every argument is read inside the try.
    let args: unknown[];
    try {
        const decoded = AbiCoder.defaultAbiCoder().decode(entry.types, `0x${hex.slice(10)}`);
        args = entry.types.map((_, i) => decoded[i]);
    } catch (e) {
        return undefined;
    }
    const [first, second, third] = args;
    switch (entry.method) {
        case 'approve':
        case 'increaseAllowance':
            return {
                method: entry.method,
                spender: first as string,
                amount: second as bigint,
                unlimited: (second as bigint) >= UNLIMITED_ALLOWANCE
            };
        case 'setApprovalForAll':
            return {
                method: 'setApprovalForAll',
                operator: first as string,
                approved: second as boolean
            };
        case 'transfer':
            return { method: 'transfer', recipient: first as string, amount: second as bigint };
        case 'transferFrom':
            return {
                method: 'transferFrom',
                from: first as string,
                recipient: second as string,
                amount: third as bigint
            };
    }
};

export const summarizeEvmTransaction = (
    transaction: WalletConnectEvmTransaction
): DappTransactionSummary => {
    const value = parseQuantity(transaction.value ?? '0');
    const to = transaction.to?.trim();
    const data = hasCalldata(transaction.data) ? transaction.data.trim() : undefined;
    if (!to) {
        return { kind: 'deploy', value, data: data ?? '0x' };
    }
    if (data === undefined) {
        return { kind: 'transfer', to, value };
    }
    return { kind: 'call', to, value, data, call: decodeEvmCall(data) };
};

const withTronAddresses = (call: EvmDecodedCall | undefined): EvmDecodedCall | undefined => {
    if (call === undefined) return undefined;
    switch (call.method) {
        case 'approve':
        case 'increaseAllowance':
            return { ...call, spender: tronAddressFromEvmHex(call.spender) };
        case 'setApprovalForAll':
            return { ...call, operator: tronAddressFromEvmHex(call.operator) };
        case 'transfer':
            return { ...call, recipient: tronAddressFromEvmHex(call.recipient) };
        case 'transferFrom':
            return {
                ...call,
                from: tronAddressFromEvmHex(call.from),
                recipient: tronAddressFromEvmHex(call.recipient)
            };
    }
};

const tronContractSummary = (contract: TronContract): DappTransactionSummary => {
    if (contract.type === 'transfer') {
        return { kind: 'transfer', to: contract.to, value: contract.amount };
    }
    const data = `0x${contract.data}`;
    return {
        kind: 'call',
        to: contract.contract,
        value: contract.callValue,
        data,
        call: withTronAddresses(decodeEvmCall(data))
    };
};

export interface TronTransactionSummary {
    /** The protocol name of the contract type, e.g. `FreezeBalanceV2Contract`. */
    contractType: string;
    /** `undefined` when the contract is not one the wallet decodes. */
    summary: DappTransactionSummary | undefined;
    /** The transaction carries fields {@link summary} does not show. */
    hasUnreadFields: boolean;
}

/**
 * TRC-20 and TRC-721 share the EVM ABI, so a contract call decodes with the
 * EVM selectors and its address arguments read back in TRON form. Throws when
 * the transaction is not one {@link inspectTronTransaction} accepts.
 */
export const summarizeTronTransaction = (
    transaction: Record<string, unknown>
): TronTransactionSummary => {
    const { contract, contractType, hasUnreadFields } = inspectTronTransaction(transaction);
    return {
        contractType,
        summary: contract === undefined ? undefined : tronContractSummary(contract),
        hasUnreadFields
    };
};

/**
 * The fee an `eth_signTransaction` signature commits to: the dApp's gas limit
 * times the per-gas price it set — `maxFeePerGas` (the EIP-1559 ceiling) when
 * present, legacy `gasPrice` otherwise. Mirrors the fields the signer uses.
 */
export const evmRequestedFee = (transaction: WalletConnectEvmTransaction): bigint | undefined => {
    const gasLimit = parseQuantity(transaction.gas ?? transaction.gasLimit);
    const price = parseQuantity(transaction.maxFeePerGas ?? transaction.gasPrice);
    if (gasLimit === undefined || price === undefined) return undefined;
    return gasLimit * price;
};

/**
 * Characters that render as nothing or reorder the text around them: format
 * characters (bidi overrides and isolates, zero-width spaces and joiners, tag
 * characters, BOM), variation selectors, blank Hangul fillers, and control
 * characters other than tab and line breaks.
 */
const HIDDEN_CHARACTERS = /[\p{Cf}\p{Variation_Selector}ᅟᅠㅤﾠ]|[^\P{Cc}\t\n\r]/gu;

/** Replaces every hidden character with a visible `[U+XXXX]` marker. */
export const revealHiddenCharacters = (text: string): { text: string; hasHidden: boolean } => {
    let hasHidden = false;
    const revealed = text.replace(HIDDEN_CHARACTERS, char => {
        hasHidden = true;
        const code = char.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0');
        return `[U+${code}]`;
    });
    return { text: revealed, hasHidden };
};

/**
 * The text a `personal_sign` request signs. Hex payloads are signed as raw
 * bytes, so they read as UTF-8 only when they decode cleanly; anything else
 * stays as hex.
 */
export const personalSignText = (message: string): string => {
    if (!isHexString(message)) return message;
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(getBytes(message));
    } catch (e) {
        return message;
    }
};
