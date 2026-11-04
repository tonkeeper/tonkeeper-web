/* eslint-disable import/no-extraneous-dependencies */
import { utils } from 'tronweb';
import { describe, expect, it } from 'vitest';

import {
    assertTronTransactionMatches,
    evmHexFromTronAddress,
    inspectTronTransaction,
    readTronTransaction,
    tronAddressFromEvmHex
} from '../tron-transaction';
import {
    OWNER,
    RECIPIENT,
    USDT,
    addressBytes,
    contract,
    evmFormOf,
    lf,
    rawData,
    transferContract,
    transferValue,
    trc20Data,
    triggerContract,
    tronTransaction,
    vf
} from './tron-transaction-fixtures';

const TRANSFER_DATA = trc20Data('a9059cbb', ['address', 'uint256'], [evmFormOf(RECIPIENT), 5n]);

/** Built by tronweb's own encoder, so the reader is checked against the real wire format. */
const tronwebTransaction = (rawJson: Record<string, unknown>) => {
    const pb = utils.transaction.txJsonToPb({ visible: false, raw_data: rawJson } as never);
    return {
        visible: false,
        txID: utils.transaction.txPbToTxID(pb).replace(/^0x/, ''),
        raw_data: rawJson,
        raw_data_hex: utils.transaction.txPbToRawDataHex(pb).toLowerCase()
    };
};

const header = {
    ref_block_bytes: 'abcd',
    ref_block_hash: '0123456789abcdef',
    expiration: 1_700_000_600_000,
    timestamp: 1_700_000_000_000
};

describe('readTronTransaction', () => {
    it('reads a TransferContract built by tronweb', () => {
        const transaction = tronwebTransaction({
            ...header,
            contract: [
                {
                    type: 'TransferContract',
                    parameter: {
                        type_url: 'type.googleapis.com/protocol.TransferContract',
                        value: {
                            owner_address: `41${evmHexFromTronAddress(OWNER).slice(2)}`,
                            to_address: `41${evmHexFromTronAddress(RECIPIENT).slice(2)}`,
                            amount: 1_234_567
                        }
                    }
                }
            ]
        });

        expect(readTronTransaction(transaction)).toEqual({
            contract: { type: 'transfer', owner: OWNER, to: RECIPIENT, amount: 1_234_567n },
            feeLimit: 0n
        });
    });

    it('reads a TriggerSmartContract built by tronweb', () => {
        const transaction = tronwebTransaction({
            ...header,
            fee_limit: 150_000_000,
            contract: [
                {
                    type: 'TriggerSmartContract',
                    parameter: {
                        type_url: 'type.googleapis.com/protocol.TriggerSmartContract',
                        value: {
                            owner_address: `41${evmHexFromTronAddress(OWNER).slice(2)}`,
                            contract_address: `41${evmHexFromTronAddress(USDT).slice(2)}`,
                            data: TRANSFER_DATA
                        }
                    }
                }
            ]
        });

        expect(readTronTransaction(transaction)).toEqual({
            contract: {
                type: 'triggerSmartContract',
                owner: OWNER,
                contract: USDT,
                callValue: 0n,
                data: TRANSFER_DATA
            },
            feeLimit: 150_000_000n
        });
    });

    it('reads the raw data hex, not the readable raw data', () => {
        const transaction = {
            ...tronTransaction(rawData([transferContract(OWNER, RECIPIENT, 7n)])),
            raw_data: { contract: [{ parameter: { value: { amount: 1, to_address: USDT } } }] }
        };

        expect(readTronTransaction(transaction).contract).toMatchObject({
            to: RECIPIENT,
            amount: 7n
        });
    });

    it('requires the transaction id to be the hash of the raw data', () => {
        const transaction = tronTransaction(rawData([transferContract()]));

        expect(() => readTronTransaction({ ...transaction, txID: '00'.repeat(32) })).toThrow();
        expect(() => readTronTransaction({ ...transaction, txID: undefined })).toThrow();
    });

    it('requires exactly one contract', () => {
        expect(() => readTronTransaction(tronTransaction(rawData([])))).toThrow();
        expect(() =>
            readTronTransaction(
                tronTransaction(rawData([transferContract(), transferContract(OWNER, USDT)]))
            )
        ).toThrow();
    });

    it('refuses contract types and fields it does not model', () => {
        const permissionUpdate = contract(
            46,
            'type.googleapis.com/protocol.AccountPermissionUpdateContract',
            lf(1, [0x41, ...new Array(20).fill(1)])
        );
        const withPermissionId = [...transferContract(), ...vf(5, 2)];
        const withTokenValue = triggerContract(TRANSFER_DATA, OWNER, [...vf(5, 10), ...vf(6, 1)]);
        const wrongTypeUrl = contract(
            1,
            'type.googleapis.com/protocol.TriggerSmartContract',
            transferValue(OWNER, RECIPIENT, 1n)
        );

        for (const c of [permissionUpdate, withPermissionId, withTokenValue, wrongTypeUrl]) {
            expect(() => readTronTransaction(tronTransaction(rawData([c])))).toThrow();
        }
    });

    it('refuses a repeated field', () => {
        const doubled = contract(1, 'type.googleapis.com/protocol.TransferContract', [
            ...lf(1, [0x41, ...new Array(20).fill(1)]),
            ...lf(2, [0x41, ...new Array(20).fill(2)]),
            ...vf(3, 1),
            ...vf(3, 1_000_000)
        ]);

        expect(() => readTronTransaction(tronTransaction(rawData([doubled])))).toThrow();
    });

    it('refuses malformed raw data', () => {
        const raw = rawData([transferContract()]);

        expect(() => readTronTransaction(tronTransaction(raw.slice(0, -1)))).toThrow();
        expect(() => readTronTransaction(tronTransaction([...raw, 0x80]))).toThrow();
    });
});

describe('inspectTronTransaction', () => {
    it('reads the owner and type of a contract it does not decode', () => {
        const vote = contract(4, 'type.googleapis.com/protocol.VoteWitnessContract', [
            ...lf(1, addressBytes(OWNER)),
            ...lf(2, [...lf(1, addressBytes(RECIPIENT)), ...vf(2, 10)])
        ]);

        expect(inspectTronTransaction(tronTransaction(rawData([vote])))).toEqual({
            owner: OWNER,
            contractType: 'VoteWitnessContract',
            contract: undefined,
            hasUnreadFields: false,
            feeLimit: 0n
        });
    });

    it('decodes a modelled contract and flags the fields it leaves out', () => {
        const inspection = inspectTronTransaction(
            tronTransaction(rawData([triggerContract(TRANSFER_DATA, OWNER, vf(5, 10))]))
        );

        expect(inspection.contract).toMatchObject({ type: 'triggerSmartContract', contract: USDT });
        expect(inspection.hasUnreadFields).toBe(true);
    });

    it('still requires a matching id, one contract and an owner', () => {
        const transaction = tronTransaction(rawData([transferContract()]));
        const ownerless = contract(13, 'type.googleapis.com/protocol.WithdrawBalanceContract', []);

        expect(() => inspectTronTransaction({ ...transaction, txID: '00'.repeat(32) })).toThrow();
        expect(() =>
            inspectTronTransaction(
                tronTransaction(rawData([transferContract(), transferContract()]))
            )
        ).toThrow();
        expect(() => inspectTronTransaction(tronTransaction(rawData([ownerless])))).toThrow();
    });
});

describe('TRON address forms', () => {
    it('round-trips between base58check and EVM form', () => {
        expect(tronAddressFromEvmHex(evmHexFromTronAddress(USDT))).toBe(USDT);
    });

    it('rejects a base58 address with a broken checksum', () => {
        const broken = `${USDT.slice(0, -1)}${USDT.endsWith('t') ? 'u' : 't'}`;

        expect(() => evmHexFromTronAddress(broken)).toThrow();
    });
});

describe('assertTronTransactionMatches', () => {
    const expected = {
        contract: {
            type: 'triggerSmartContract' as const,
            owner: OWNER,
            contract: USDT,
            callValue: 0n,
            data: TRANSFER_DATA
        },
        feeLimit: 150_000_000n
    };
    const built = (data: string, extra: number[] = [], fee = 150_000_000) =>
        tronTransaction(rawData([triggerContract(data, OWNER, extra)], vf(18, fee)));

    it('accepts the transaction that was asked for', () => {
        expect(() => assertTronTransactionMatches(built(TRANSFER_DATA), expected)).not.toThrow();
    });

    it('rejects any difference from the request', () => {
        const otherRecipient = trc20Data('a9059cbb', ['address', 'uint256'], [evmFormOf(USDT), 5n]);

        expect(() => assertTronTransactionMatches(built(otherRecipient), expected)).toThrow();
        expect(() =>
            assertTronTransactionMatches(built(TRANSFER_DATA, vf(3, 1)), expected)
        ).toThrow();
        expect(() =>
            assertTronTransactionMatches(built(TRANSFER_DATA, [], 1_000_000_000), expected)
        ).toThrow();
        expect(() =>
            assertTronTransactionMatches(tronTransaction(rawData([transferContract()])), expected)
        ).toThrow();
    });
});
