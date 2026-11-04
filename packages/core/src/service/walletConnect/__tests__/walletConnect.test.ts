/* eslint-disable import/no-extraneous-dependencies */
import { buildApprovedNamespaces } from '@walletconnect/utils';
import { describe, expect, it } from 'vitest';

import { AppKey } from '../../../Keys';
import { MemoryStorage } from '../../../Storage';
import { AccountMultichain } from '../../../entries/account';
import { WalletVersion } from '../../../entries/wallet';
import { buildSupportedNamespaces, networkOfCaipChain, sessionNetworks } from '../wcChains';
import { decodeSessionRequest } from '../wcRequestTypes';
import { WalletConnectStorage } from '../wcStorageAdapter';
import { isWalletConnectRedirectUrl, parseWalletConnectUri } from '../wcUri';
import {
    OWNER,
    addressBytes,
    contract,
    lf,
    rawData,
    transferContract,
    tronTransaction
} from '../../tron-blockchain/__tests__/tron-transaction-fixtures';

const WC_URI =
    'wc:aff5b1122b7654895b5a08e5f0e1a20a0e0f80c2ba0ad3540c0c8dbef9ce8e50@2?relay-protocol=irn&symKey=587a5484cf7c17e64f269d21f129d1e14ddbtestc39fb51f9160cd6542bf7c46';

describe('parseWalletConnectUri', () => {
    it('accepts a raw wc: v2 URI, tolerating whitespace and wc://', () => {
        expect(parseWalletConnectUri(WC_URI)).toBe(WC_URI);
        expect(parseWalletConnectUri(`  ${WC_URI}\n`)).toBe(WC_URI);
        expect(parseWalletConnectUri(WC_URI.replace('wc:', 'wc://'))).toBe(WC_URI);
    });

    it('unwraps a uri query parameter', () => {
        const wrapped = `https://wallet.tonkeeper.com/wc?uri=${encodeURIComponent(WC_URI)}`;
        expect(parseWalletConnectUri(wrapped)).toBe(WC_URI);
        expect(parseWalletConnectUri(`tonkeeper://wc?uri=${encodeURIComponent(WC_URI)}`)).toBe(
            WC_URI
        );
    });

    it('rejects non-WalletConnect input', () => {
        expect(parseWalletConnectUri('https://getgems.io')).toBeNull();
        expect(parseWalletConnectUri('tc://?v=2&id=abc&r=%7B%7D')).toBeNull();
        expect(parseWalletConnectUri('wc:tooshort@2?x=1')).toBeNull();
        expect(parseWalletConnectUri('wc:' + 'a'.repeat(64) + '@1?x=1')).toBeNull();
        expect(parseWalletConnectUri('')).toBeNull();
    });
});

describe('isWalletConnectRedirectUrl', () => {
    it('recognizes redirect-back links that carry no pairing uri', () => {
        expect(isWalletConnectRedirectUrl('tonkeeper://wc?requestId=1&sessionTopic=abc')).toBe(
            true
        );
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wc')).toBe(true);
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wc/?x=1')).toBe(true);
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wc?wc_ev=ev&topic=t')).toBe(
            true
        );
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wc/session/request')).toBe(
            true
        );
        expect(isWalletConnectRedirectUrl('tonkeeper://wc')).toBe(true);
    });

    it('does not swallow links that carry a uri parameter, even a malformed one', () => {
        expect(
            isWalletConnectRedirectUrl(
                `https://app.tonkeeper.com/wc?uri=${encodeURIComponent(WC_URI)}`
            )
        ).toBe(false);
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wc?uri=garbage')).toBe(false);
    });

    it('ignores unrelated links', () => {
        expect(isWalletConnectRedirectUrl('https://getgems.io')).toBe(false);
        expect(isWalletConnectRedirectUrl('https://app.tonkeeper.com/wcx')).toBe(false);
        expect(isWalletConnectRedirectUrl('not a url')).toBe(false);
        expect(isWalletConnectRedirectUrl(WC_URI)).toBe(false);
    });
});

const EVM_ADDRESS = '0x8ba1f109551bD432803012645Ac136ddd64DBA72';
const TRON_ADDRESS = 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8';

const makeAccount = (chains: ('evm' | 'tron')[] = ['evm', 'tron']) =>
    new AccountMultichain(
        'test-account',
        'Test',
        '🧪',
        { kind: 'password', encryptedSecret: '' },
        ['ton', ...chains],
        {
            ton: 'ton-wallet',
            ...(chains.includes('evm') ? { evm: 'evm-wallet' } : {}),
            ...(chains.includes('tron') ? { tron: 'tron-wallet' } : {})
        },
        [
            {
                id: 'ton-wallet',
                rawAddress: '0:0000000000000000000000000000000000000000000000000000000000000000',
                publicKey: '00'.repeat(32),
                version: WalletVersion.V5R1
            },
            ...(chains.includes('evm')
                ? [
                      {
                          id: 'evm-wallet',
                          chain: 'evm' as const,
                          rawAddress: EVM_ADDRESS,
                          publicKey: '04'.repeat(33),
                          derivationPath: "m/44'/60'/0'/0/0"
                      }
                  ]
                : []),
            ...(chains.includes('tron')
                ? [
                      {
                          id: 'tron-wallet',
                          chain: 'tron' as const,
                          rawAddress: TRON_ADDRESS,
                          publicKey: '02'.repeat(33),
                          derivationPath: "m/44'/195'/0'/0/0"
                      }
                  ]
                : [])
        ]
    );

describe('buildSupportedNamespaces', () => {
    it('offers every eip155 chain from the single EVM wallet plus tron', () => {
        const namespaces = buildSupportedNamespaces(makeAccount());

        expect(namespaces.eip155.chains).toEqual([
            'eip155:1',
            'eip155:8453',
            'eip155:56',
            'eip155:42161'
        ]);
        expect(namespaces.eip155.accounts).toContain(`eip155:1:${EVM_ADDRESS}`);
        expect(namespaces.eip155.methods).toContain('eth_sendTransaction');
        expect(namespaces.tron.accounts).toEqual([`tron:0x2b6653dc:${TRON_ADDRESS}`]);
        expect(namespaces.tron.methods).toEqual(['tron_signMessage', 'tron_signTransaction']);
    });

    it('omits namespaces for chains the account has no wallet on', () => {
        const namespaces = buildSupportedNamespaces(makeAccount(['evm']));

        expect(namespaces.eip155).toBeDefined();
        expect(namespaces.tron).toBeUndefined();
    });

    it('satisfies buildApprovedNamespaces for an eip155 proposal', () => {
        const approved = buildApprovedNamespaces({
            proposal: {
                id: 1,
                relays: [{ protocol: 'irn' }],
                proposer: {
                    publicKey: '00',
                    metadata: { name: '', description: '', url: '', icons: [] }
                },
                expiryTimestamp: 0,
                pairingTopic: '00',
                requiredNamespaces: {
                    eip155: {
                        chains: ['eip155:1'],
                        methods: ['personal_sign', 'eth_sendTransaction'],
                        events: ['chainChanged']
                    }
                },
                optionalNamespaces: {}
            },
            supportedNamespaces: buildSupportedNamespaces(makeAccount())
        });

        expect(approved.eip155.accounts).toContain(`eip155:1:${EVM_ADDRESS}`);
    });
});

describe('sessionNetworks', () => {
    it('derives granted network codes from namespace accounts in stable order', () => {
        expect(
            sessionNetworks({
                tron: { accounts: [`tron:0x2b6653dc:${TRON_ADDRESS}`] },
                eip155: {
                    accounts: [`eip155:56:${EVM_ADDRESS}`, `eip155:1:${EVM_ADDRESS}`]
                }
            })
        ).toEqual(['tron', 'eth', 'bsc']);
    });

    it('resolves CAIP chains back to network codes', () => {
        expect(networkOfCaipChain('eip155:8453')).toBe('base');
        expect(networkOfCaipChain('eip155:137')).toBeUndefined();
    });
});

const requestEvent = (method: string, params: unknown, chainId = 'eip155:1') => ({
    id: 42,
    topic: 'topic-1',
    params: { request: { method, params }, chainId },
    verifyContext: {
        verified: { origin: 'https://app.uniswap.org', validation: 'VALID' as const }
    }
});

describe('decodeSessionRequest', () => {
    it('decodes personal_sign with [message, address] order', () => {
        const result = decodeSessionRequest(
            requestEvent('personal_sign', ['0xdeadbeef', EVM_ADDRESS])
        );

        expect(result).toMatchObject({
            ok: true,
            payload: {
                kind: 'personal_sign',
                message: '0xdeadbeef',
                address: EVM_ADDRESS,
                network: 'eth',
                verification: { validation: 'VALID', isScam: false }
            }
        });
    });

    it('decodes eth_signTypedData_v4 with a JSON string payload', () => {
        const typedData = {
            types: { EIP712Domain: [], Mail: [{ name: 'contents', type: 'string' }] },
            primaryType: 'Mail',
            domain: { name: 'Mail' },
            message: { contents: 'Hello, Bob!' }
        };
        const result = decodeSessionRequest(
            requestEvent('eth_signTypedData_v4', [EVM_ADDRESS, JSON.stringify(typedData)])
        );

        expect(result).toMatchObject({
            ok: true,
            payload: { kind: 'eth_signTypedData_v4', address: EVM_ADDRESS }
        });
        if (result.ok && result.payload.kind === 'eth_signTypedData_v4') {
            expect(result.payload.typedData.primaryType).toBe('Mail');
        }
    });

    describe('eth_signTypedData_v4 domain chain id', () => {
        const typedDataWithDomain = (domain: unknown) => ({
            types: { Mail: [{ name: 'contents', type: 'string' }] },
            primaryType: 'Mail',
            domain,
            message: { contents: 'Hello, Bob!' }
        });
        const decodeOn = (chainId: string, typedData: unknown) =>
            decodeSessionRequest(
                requestEvent('eth_signTypedData_v4', [EVM_ADDRESS, typedData], chainId)
            );

        it.each([56, '0x38', '0X38', '56'])('accepts chainId %p on eip155:56', chainId => {
            expect(decodeOn('eip155:56', typedDataWithDomain({ chainId }))).toMatchObject({
                ok: true,
                payload: { kind: 'eth_signTypedData_v4', network: 'bsc' }
            });
        });

        it('accepts a domain without chainId', () => {
            expect(decodeOn('eip155:1', typedDataWithDomain({ name: 'Mail' }))).toMatchObject({
                ok: true
            });
            expect(decodeOn('eip155:1', typedDataWithDomain({ chainId: null }))).toMatchObject({
                ok: true
            });
        });

        it.each([1, '0x1', '1', 8453])('rejects chainId %p on eip155:56', chainId => {
            expect(decodeOn('eip155:56', typedDataWithDomain({ chainId }))).toEqual({
                ok: false,
                error: 'unsupported_chain'
            });
        });

        it.each([{ value: 56 }, [56], 'abc', '', '0x', '-56', ' 56', 56.5, -1, true])(
            'rejects malformed chainId %p',
            chainId => {
                expect(decodeOn('eip155:56', typedDataWithDomain({ chainId }))).toEqual({
                    ok: false,
                    error: 'unsupported_chain'
                });
            }
        );

        it('checks the chainId that survives duplicate keys', () => {
            const raw =
                '{"types":{"Mail":[{"name":"contents","type":"string"}]},"primaryType":"Mail",' +
                '"domain":{"chainId":56,"chainId":1},"message":{"contents":"Hello"}}';
            expect(decodeOn('eip155:56', raw)).toEqual({ ok: false, error: 'unsupported_chain' });
        });

        it('rejects typed data without a domain object', () => {
            expect(decodeOn('eip155:1', typedDataWithDomain(undefined))).toEqual({
                ok: false,
                error: 'invalid_params'
            });
            expect(decodeOn('eip155:1', typedDataWithDomain('0x1'))).toEqual({
                ok: false,
                error: 'invalid_params'
            });
        });
    });

    it('decodes eth_sendTransaction taking the address from tx.from', () => {
        const result = decodeSessionRequest(
            requestEvent(
                'eth_sendTransaction',
                [
                    {
                        from: EVM_ADDRESS,
                        to: '0x1111111111111111111111111111111111111111',
                        value: '0x0'
                    }
                ],
                'eip155:8453'
            )
        );

        expect(result).toMatchObject({
            ok: true,
            payload: { kind: 'eth_sendTransaction', address: EVM_ADDRESS, network: 'base' }
        });
    });

    it('decodes tron methods in both positional and object form', () => {
        const objectForm = decodeSessionRequest(
            requestEvent(
                'tron_signMessage',
                { address: TRON_ADDRESS, message: 'hello' },
                'tron:0x2b6653dc'
            )
        );
        const arrayForm = decodeSessionRequest(
            requestEvent(
                'tron_signMessage',
                [{ address: TRON_ADDRESS, message: 'hello' }],
                'tron:0x2b6653dc'
            )
        );

        for (const result of [objectForm, arrayForm]) {
            expect(result).toMatchObject({
                ok: true,
                payload: { kind: 'tron_signMessage', address: TRON_ADDRESS, network: 'tron' }
            });
        }
    });

    it('accepts a tron_signTransaction the account can sign and refuses the rest', () => {
        const single = tronTransaction(rawData([transferContract()]));
        const double = tronTransaction(rawData([transferContract(), transferContract()]));
        const permissionUpdate = tronTransaction(
            rawData([
                contract(
                    46,
                    'type.googleapis.com/protocol.AccountPermissionUpdateContract',
                    lf(1, addressBytes(OWNER))
                )
            ])
        );
        const decode = (transaction: unknown, address = OWNER) =>
            decodeSessionRequest(
                requestEvent('tron_signTransaction', { address, transaction }, 'tron:0x2b6653dc')
            );

        expect(decode(single)).toMatchObject({
            ok: true,
            payload: { kind: 'tron_signTransaction', address: OWNER }
        });
        expect(decode(single, TRON_ADDRESS)).toEqual({ ok: false, error: 'invalid_params' });
        expect(decode(permissionUpdate)).toMatchObject({ ok: true });
        expect(decode(double)).toEqual({ ok: false, error: 'invalid_params' });
        expect(decode({ ...single, txID: '00'.repeat(32) })).toEqual({
            ok: false,
            error: 'invalid_params'
        });
    });

    it('rejects unsupported methods, chains, and malformed params', () => {
        expect(decodeSessionRequest(requestEvent('wallet_watchAsset', []))).toEqual({
            ok: false,
            error: 'unsupported_method'
        });
        expect(
            decodeSessionRequest(requestEvent('personal_sign', ['0x00', EVM_ADDRESS], 'eip155:137'))
        ).toEqual({ ok: false, error: 'unsupported_chain' });
        expect(decodeSessionRequest(requestEvent('personal_sign', 'not-an-array'))).toEqual({
            ok: false,
            error: 'invalid_params'
        });
        expect(decodeSessionRequest(requestEvent('eth_sendTransaction', [{ to: '0x11' }]))).toEqual(
            {
                ok: false,
                error: 'invalid_params'
            }
        );
    });
});

describe('WalletConnectStorage', () => {
    it('persists the whole map under AppKey.WALLET_CONNECT and reads it back', async () => {
        const backing = new MemoryStorage();
        const storage = new WalletConnectStorage(backing);

        await storage.setItem('wc@2:core:pairing', [{ topic: 't1' }]);
        await storage.setItem('wc@2:client:session', [{ topic: 't2' }]);
        await storage.removeItem('wc@2:core:pairing');

        expect(await storage.getKeys()).toEqual(['wc@2:client:session']);
        expect(await storage.getItem('wc@2:client:session')).toEqual([{ topic: 't2' }]);
        expect(await storage.getItem('missing')).toBeUndefined();

        const fresh = new WalletConnectStorage(backing);
        expect(await fresh.getEntries()).toEqual([['wc@2:client:session', [{ topic: 't2' }]]]);
        expect(backing.storage[AppKey.WALLET_CONNECT]).toBeDefined();
    });

    it('serializes concurrent writes without losing entries', async () => {
        const storage = new WalletConnectStorage(new MemoryStorage());

        await Promise.all(Array.from({ length: 20 }, (_, i) => storage.setItem(`key-${i}`, i)));

        expect((await storage.getKeys()).length).toBe(20);
    });
});
