/* eslint-disable import/no-extraneous-dependencies */
import { Interface, MaxUint256 } from 'ethers';
import { describe, expect, it } from 'vitest';

import {
    decodeEvmCall,
    evmRequestedFee,
    personalSignText,
    revealHiddenCharacters,
    summarizeEvmTransaction,
    summarizeTronTransaction
} from '../wcRequestSummary';
import {
    OWNER as TRON_OWNER,
    RECIPIENT as TRON_RECIPIENT,
    USDT as TRON_USDT,
    addressBytes,
    contract,
    evmFormOf,
    lf,
    rawData,
    transferContract,
    triggerContract,
    tronTransaction,
    vf
} from '../../tron-blockchain/__tests__/tron-transaction-fixtures';

const erc = new Interface([
    'function approve(address spender, uint256 amount)',
    'function increaseAllowance(address spender, uint256 amount)',
    'function setApprovalForAll(address operator, bool approved)',
    'function transfer(address to, uint256 amount)',
    'function transferFrom(address from, address to, uint256 amount)',
    'function swap(uint256 amount)'
]);

const SPENDER = '0x1111111111111111111111111111111111111111';
const OWNER = '0x2222222222222222222222222222222222222222';
const TOKEN = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

describe('decodeEvmCall', () => {
    it('flags max-uint256 and max-uint96 approvals as unlimited', () => {
        expect(decodeEvmCall(erc.encodeFunctionData('approve', [SPENDER, MaxUint256]))).toEqual({
            method: 'approve',
            spender: SPENDER,
            amount: MaxUint256,
            unlimited: true
        });
        const uint96Max = 2n ** 96n - 1n;
        expect(
            decodeEvmCall(erc.encodeFunctionData('increaseAllowance', [SPENDER, uint96Max]))
        ).toMatchObject({ method: 'increaseAllowance', unlimited: true });
    });

    it('keeps bounded approvals bounded', () => {
        expect(decodeEvmCall(erc.encodeFunctionData('approve', [SPENDER, 1_000_000n]))).toEqual({
            method: 'approve',
            spender: SPENDER,
            amount: 1_000_000n,
            unlimited: false
        });
    });

    it('decodes setApprovalForAll, transfer and transferFrom', () => {
        expect(decodeEvmCall(erc.encodeFunctionData('setApprovalForAll', [SPENDER, true]))).toEqual(
            { method: 'setApprovalForAll', operator: SPENDER, approved: true }
        );
        expect(decodeEvmCall(erc.encodeFunctionData('transfer', [SPENDER, 5n]))).toEqual({
            method: 'transfer',
            recipient: SPENDER,
            amount: 5n
        });
        expect(decodeEvmCall(erc.encodeFunctionData('transferFrom', [OWNER, SPENDER, 7n]))).toEqual(
            { method: 'transferFrom', from: OWNER, recipient: SPENDER, amount: 7n }
        );
    });

    it('accepts upper-case calldata', () => {
        const data = erc.encodeFunctionData('transfer', [SPENDER, 5n]);
        expect(decodeEvmCall(`0x${data.slice(2).toUpperCase()}`)).toMatchObject({
            method: 'transfer',
            amount: 5n
        });
    });

    it('rejects unknown selectors and malformed arguments', () => {
        expect(decodeEvmCall(erc.encodeFunctionData('swap', [1n]))).toBeUndefined();
        const approve = erc.encodeFunctionData('approve', [SPENDER, 1n]);
        expect(decodeEvmCall(approve.slice(0, -2))).toBeUndefined();
        expect(decodeEvmCall(`${approve}00`)).toBeUndefined();
        expect(decodeEvmCall(`${approve.slice(0, 10)}${'ff'.repeat(64)}`)).toBeUndefined();
    });
});

describe('summarizeEvmTransaction', () => {
    it('reads a call without value as an explicit zero', () => {
        const data = erc.encodeFunctionData('approve', [SPENDER, MaxUint256]);
        expect(summarizeEvmTransaction({ from: OWNER, to: TOKEN, data })).toMatchObject({
            kind: 'call',
            to: TOKEN,
            value: 0n,
            call: { method: 'approve', unlimited: true }
        });
    });

    it('treats empty calldata as a plain transfer', () => {
        expect(
            summarizeEvmTransaction({
                from: OWNER,
                to: SPENDER,
                value: '0xde0b6b3a7640000',
                data: '0x'
            })
        ).toEqual({ kind: 'transfer', to: SPENDER, value: 10n ** 18n });
    });

    it('treats a missing recipient as a contract deployment', () => {
        expect(summarizeEvmTransaction({ from: OWNER, data: '0x6080' })).toEqual({
            kind: 'deploy',
            value: 0n,
            data: '0x6080'
        });
    });

    it('leaves undecodable calldata visible', () => {
        const data = erc.encodeFunctionData('swap', [1n]);
        expect(summarizeEvmTransaction({ from: OWNER, to: TOKEN, data })).toEqual({
            kind: 'call',
            to: TOKEN,
            value: 0n,
            data,
            call: undefined
        });
    });
});

describe('evmRequestedFee', () => {
    it('multiplies the gas limit by maxFeePerGas, else gasPrice', () => {
        expect(
            evmRequestedFee({ gas: '0x5208', maxFeePerGas: '0x3b9aca00', gasPrice: '0x1' })
        ).toBe(21000n * 1_000_000_000n);
        expect(evmRequestedFee({ gasLimit: '21000', gasPrice: '2' })).toBe(42000n);
    });

    it('is undefined when the dApp left gas fields out', () => {
        expect(evmRequestedFee({ gas: '0x5208' })).toBeUndefined();
        expect(evmRequestedFee({ gasPrice: '0x1' })).toBeUndefined();
    });
});

describe('summarizeTronTransaction', () => {
    it('reads a TRX transfer as recipient and amount', () => {
        const transaction = tronTransaction(
            rawData([transferContract(TRON_OWNER, TRON_RECIPIENT, 2_500_000n)])
        );

        expect(summarizeTronTransaction(transaction)).toEqual({
            contractType: 'TransferContract',
            summary: { kind: 'transfer', to: TRON_RECIPIENT, value: 2_500_000n },
            hasUnreadFields: false
        });
    });

    it('decodes TRC-20 calls with their addresses in TRON form', () => {
        const transfer = erc
            .encodeFunctionData('transfer', [evmFormOf(TRON_RECIPIENT), 5n])
            .slice(2);
        const approve = erc
            .encodeFunctionData('approve', [evmFormOf(TRON_RECIPIENT), MaxUint256])
            .slice(2);

        expect(
            summarizeTronTransaction(tronTransaction(rawData([triggerContract(transfer)]))).summary
        ).toEqual({
            kind: 'call',
            to: TRON_USDT,
            value: 0n,
            data: `0x${transfer}`,
            call: { method: 'transfer', recipient: TRON_RECIPIENT, amount: 5n }
        });
        expect(
            summarizeTronTransaction(tronTransaction(rawData([triggerContract(approve)]))).summary
        ).toMatchObject({
            kind: 'call',
            call: { method: 'approve', spender: TRON_RECIPIENT, unlimited: true }
        });
    });

    it('leaves an unknown selector undecoded', () => {
        const swap = erc.encodeFunctionData('swap', [1n]).slice(2);

        expect(
            summarizeTronTransaction(tronTransaction(rawData([triggerContract(swap)]))).summary
        ).toMatchObject({ kind: 'call', to: TRON_USDT, call: undefined });
    });

    it('names a contract it does not decode and flags fields it does not show', () => {
        const freeze = contract(54, 'type.googleapis.com/protocol.FreezeBalanceV2Contract', [
            ...lf(1, addressBytes(TRON_OWNER)),
            ...vf(2, 1_000_000),
            ...vf(3, 1)
        ]);
        const withPermissionId = [...transferContract(), ...vf(5, 2)];

        expect(summarizeTronTransaction(tronTransaction(rawData([freeze])))).toEqual({
            contractType: 'FreezeBalanceV2Contract',
            summary: undefined,
            hasUnreadFields: false
        });
        expect(
            summarizeTronTransaction(tronTransaction(rawData([withPermissionId])))
        ).toMatchObject({ summary: { kind: 'transfer' }, hasUnreadFields: true });
    });

    it('throws for a transaction it cannot read', () => {
        expect(() =>
            summarizeTronTransaction(
                tronTransaction(rawData([transferContract(), transferContract()]))
            )
        ).toThrow();
    });
});

describe('revealHiddenCharacters', () => {
    it('marks bidi overrides, zero-width and control characters', () => {
        expect(revealHiddenCharacters('pay‮eht​\u0007')).toEqual({
            text: 'pay[U+202E]eht[U+200B][U+0007]',
            hasHidden: true
        });
    });

    it('keeps ordinary text, tabs and line breaks untouched', () => {
        expect(revealHiddenCharacters('Sign in\n\tnonce: 42')).toEqual({
            text: 'Sign in\n\tnonce: 42',
            hasHidden: false
        });
    });
});

describe('personalSignText', () => {
    it('decodes hex UTF-8 and keeps undecodable bytes as hex', () => {
        expect(personalSignText('0x48656c6c6f')).toBe('Hello');
        expect(personalSignText('0xff00')).toBe('0xff00');
        expect(personalSignText('plain text')).toBe('plain text');
    });
});
