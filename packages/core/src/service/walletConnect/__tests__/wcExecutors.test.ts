/* eslint-disable import/no-extraneous-dependencies */
import { Transaction, verifyMessage, verifyTypedData } from 'ethers';
import { TronWeb, utils } from 'tronweb';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Neutralize ESM-resolution failures from sub-modules pulled in transitively
// by the secrets module. The mnemonic-level executor under test never
// reaches the keychain.
vi.mock('@ton-keychain/core', () => ({}));
vi.mock('@ton-keychain/trx', () => ({}));

import { ensureReady } from '../../../chains/ready';
import { WalletConnectRequestPayload } from '../wcRequestTypes';
import { executeWalletConnectRequestWithMnemonic } from '../wcExecutors';

beforeAll(() => ensureReady());

/**
 * The canonical BIP39 reference vector, pinned to the same addresses as
 * `chains/__tests__/multichain-fixtures.test.ts` — WalletConnect signing
 * must recover to exactly the addresses stored on `AccountMultichain`.
 */
const MNEMONIC =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about'.split(
        ' '
    );
const EVM_ADDRESS = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';
const TRON_ADDRESS = 'TUEZSdKsoDHQMeZwihtdoBiN46zxhGWYdH';

const base = {
    topic: 'topic-1',
    id: 1,
    caipChain: 'eip155:1',
    network: 'eth',
    address: EVM_ADDRESS
} as const;

describe('executeWalletConnectRequestWithMnemonic', () => {
    it('personal_sign recovers to the account EVM address for hex and utf8 messages', async () => {
        const hexSignature = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            kind: 'personal_sign',
            message: '0x48656c6c6f'
        })) as string;
        expect(verifyMessage('Hello', hexSignature)).toBe(EVM_ADDRESS);

        const utf8Signature = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            kind: 'personal_sign',
            message: 'Hello'
        })) as string;
        expect(utf8Signature).toBe(hexSignature);
    });

    it('eth_signTypedData_v4 recovers to the account EVM address', async () => {
        const typedData = {
            types: {
                EIP712Domain: [
                    { name: 'name', type: 'string' },
                    { name: 'chainId', type: 'uint256' }
                ],
                Mail: [
                    { name: 'contents', type: 'string' },
                    { name: 'to', type: 'address' }
                ]
            },
            primaryType: 'Mail',
            domain: { name: 'Mail', chainId: 1 },
            message: { contents: 'Hello, Bob!', to: EVM_ADDRESS }
        };

        const signature = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            kind: 'eth_signTypedData_v4',
            typedData
        })) as string;

        expect(
            verifyTypedData(
                typedData.domain,
                { Mail: typedData.types.Mail },
                typedData.message,
                signature
            )
        ).toBe(EVM_ADDRESS);
    });

    it('eth_signTransaction returns RLP hex that re-parses with the dApp fields intact', async () => {
        const signed = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            caipChain: 'eip155:8453',
            network: 'base',
            kind: 'eth_signTransaction',
            transaction: {
                from: EVM_ADDRESS,
                to: '0x1111111111111111111111111111111111111111',
                value: '0xde0b6b3a7640000',
                data: '0xabcdef',
                nonce: '0x7',
                gas: '0x5208',
                maxFeePerGas: '0x3b9aca00',
                maxPriorityFeePerGas: '0x3b9aca00'
            }
        })) as string;

        const parsed = Transaction.from(signed);
        expect(parsed.from).toBe(EVM_ADDRESS);
        expect(parsed.to).toBe('0x1111111111111111111111111111111111111111');
        expect(parsed.chainId).toBe(8453n);
        expect(parsed.value).toBe(1000000000000000000n);
        expect(parsed.nonce).toBe(7);
        expect(parsed.data).toBe('0xabcdef');
    });

    it('eth_signTransaction rejects requests without explicit gas parameters', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                kind: 'eth_signTransaction',
                transaction: {
                    from: EVM_ADDRESS,
                    to: '0x1111111111111111111111111111111111111111',
                    nonce: '0x1'
                }
            })
        ).rejects.toThrow('gas parameters');
    });

    it('tron_signMessage verifies against the account TRON address', async () => {
        const signature = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            caipChain: 'tron:0x2b6653dc',
            network: 'tron',
            address: TRON_ADDRESS,
            kind: 'tron_signMessage',
            message: 'hello tron'
        })) as string;

        const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
        expect(await tronWeb.trx.verifyMessageV2('hello tron', signature)).toBe(TRON_ADDRESS);
    });

    it('tron_signTransaction signs a valid transaction owned by the account address', async () => {
        const tronWeb = new TronWeb({ fullHost: 'https://api.trongrid.io' });
        const rawData = {
            contract: [
                {
                    parameter: {
                        value: {
                            amount: 1000,
                            owner_address: tronWeb.address.toHex(TRON_ADDRESS),
                            to_address: tronWeb.address.toHex('TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP')
                        },
                        type_url: 'type.googleapis.com/protocol.TransferContract'
                    },
                    type: 'TransferContract' as const
                }
            ],
            ref_block_bytes: 'abcd',
            ref_block_hash: '0123456789abcdef',
            expiration: 1234567890000,
            timestamp: 1234567800000
        };
        // Derive raw_data_hex/txID from raw_data so tronweb's txCheck
        // integrity validation passes as it would for a real dApp payload.
        const pb = utils.transaction.txJsonToPb({ visible: false, raw_data: rawData });
        const transaction = {
            visible: false,
            txID: utils.transaction.txPbToTxID(pb).replace(/^0x/, ''),
            raw_data: rawData,
            raw_data_hex: utils.transaction.txPbToRawDataHex(pb).toLowerCase()
        };

        const result = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            caipChain: 'tron:0x2b6653dc',
            network: 'tron',
            address: TRON_ADDRESS,
            kind: 'tron_signTransaction',
            transaction
        })) as { txID: string; signature: string[] };

        expect(result.txID).toBe(transaction.txID);
        expect(result.signature).toHaveLength(1);
        expect(result.signature[0]).toMatch(/^[0-9a-f]{130}$/i);
    });
});

describe('request address', () => {
    const OTHER_EVM_ADDRESS = '0x1111111111111111111111111111111111111111';

    it('accepts the account address in any letter case', async () => {
        const signature = (await executeWalletConnectRequestWithMnemonic(MNEMONIC, {
            ...base,
            address: ` ${EVM_ADDRESS.toLowerCase()} `,
            kind: 'personal_sign',
            message: 'Hello'
        })) as string;
        expect(verifyMessage('Hello', signature)).toBe(EVM_ADDRESS);
    });

    it('rejects a message addressed to another account', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                address: OTHER_EVM_ADDRESS,
                kind: 'personal_sign',
                message: 'Hello'
            })
        ).rejects.toThrow('does not match');
    });

    it('rejects a request with an empty address', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                address: '',
                kind: 'personal_sign',
                message: 'Hello'
            })
        ).rejects.toThrow('does not match');
    });

    it('rejects a transaction from another account', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                kind: 'eth_sendTransaction',
                transaction: {
                    from: OTHER_EVM_ADDRESS,
                    to: '0x2222222222222222222222222222222222222222',
                    value: '0x1'
                }
            })
        ).rejects.toThrow('does not match');
    });

    it('rejects a TRON request addressed to another account', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                caipChain: 'tron:0x2b6653dc',
                network: 'tron',
                address: 'TN9RRaXkCFtTXRso2GdTZxSxxwufzxLQPP',
                kind: 'tron_signMessage',
                message: 'hello tron'
            })
        ).rejects.toThrow('does not match');
    });
});

describe('unsupported executor input', () => {
    it('throws on unknown request kinds', async () => {
        await expect(
            executeWalletConnectRequestWithMnemonic(MNEMONIC, {
                ...base,
                kind: 'wallet_watchAsset'
            } as unknown as WalletConnectRequestPayload)
        ).rejects.toThrow();
    });
});
