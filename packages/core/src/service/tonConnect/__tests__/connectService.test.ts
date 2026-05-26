/* eslint-disable import/no-extraneous-dependencies */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TonConnectError } from '../../../entries/exception';
import {
    ConnectRequest,
    SEND_TRANSACTION_ERROR_CODES,
    TonConnectNetwork
} from '../../../entries/tonConnect';
import { Network } from '../../../entries/network';
import type { TonContract } from '../../../entries/wallet';
import type { IStorage } from '../../../Storage';

const mocks = vi.hoisted(() => ({
    getAccounts: vi.fn(),
    getAccountByWalletById: vi.fn()
}));

vi.mock('../../accountsStorage', () => ({
    accountsStorage: () => ({
        getAccounts: mocks.getAccounts
    })
}));

vi.mock('../../../entries/account', async () => {
    const actual = await vi.importActual<typeof import('../../../entries/account')>(
        '../../../entries/account'
    );
    return {
        ...actual,
        getAccountByWalletById: mocks.getAccountByWalletById
    };
});

const {
    sendBadRequestResponse,
    checkTonConnectFromAndNetwork,
    checkDappOriginMatchesManifest,
    getManifest
} = await import('../connectService');

const fakeStorage = {} as IStorage;

const makeWallet = (overrides: Partial<TonContract> = {}): TonContract =>
    ({
        id: 'wallet-1',
        rawAddress: '0:abc',
        ...overrides
    } as TonContract);

describe('sendBadRequestResponse', () => {
    it('returns BAD_REQUEST_ERROR with default message when no custom message is passed', () => {
        const response = sendBadRequestResponse('req-1', 'sendTransaction');

        expect(response).toEqual({
            id: 'req-1',
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: 'Method "sendTransaction" is not supported by the wallet app'
            }
        });
    });

    it('respects a custom message', () => {
        const response = sendBadRequestResponse(
            'req-2',
            'sendTransaction',
            'Invalid account provided'
        );

        expect(response).toEqual({
            id: 'req-2',
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: 'Invalid account provided'
            }
        });
    });

    it('does not leak the method name when a custom message is used', () => {
        const response = sendBadRequestResponse('id', 'signData', 'Unknown session');

        expect(response.error.message).toBe('Unknown session');
        expect(response.error.message).not.toContain('signData');
    });
});

describe('checkTonConnectFromAndNetwork', () => {
    beforeEach(() => {
        mocks.getAccounts.mockReset();
        mocks.getAccountByWalletById.mockReset();
    });

    it('does nothing when neither from nor network are provided', async () => {
        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, makeWallet(), {})
        ).resolves.toBeUndefined();

        expect(mocks.getAccounts).not.toHaveBeenCalled();
        expect(mocks.getAccountByWalletById).not.toHaveBeenCalled();
    });

    it('passes when "from" matches the wallet raw address (case-insensitive)', async () => {
        const wallet = makeWallet({ rawAddress: '0:AbCdEf' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, { from: '0:abcdef' })
        ).resolves.toBeUndefined();
    });

    it('throws TonConnectError(BAD_REQUEST) when "from" does not match the wallet', async () => {
        const wallet = makeWallet({ rawAddress: '0:aaaa' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, { from: '0:bbbb' })
        ).rejects.toMatchObject({
            name: 'Error',
            message: 'Invalid account provided',
            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR
        });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, { from: '0:bbbb' })
        ).rejects.toBeInstanceOf(TonConnectError);
    });

    it('throws when mainnet is requested but the wallet lives on a testnet account', async () => {
        const wallet = makeWallet();
        mocks.getAccounts.mockResolvedValue([]);
        mocks.getAccountByWalletById.mockReturnValue({ type: 'testnet' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, {
                network: Network.MAINNET.toString() as TonConnectNetwork
            })
        ).rejects.toMatchObject({
            message: 'Invalid network provided',
            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR
        });
    });

    it('throws when testnet is requested but the wallet lives on a non-testnet account', async () => {
        const wallet = makeWallet();
        mocks.getAccounts.mockResolvedValue([]);
        mocks.getAccountByWalletById.mockReturnValue({ type: 'mnemonic' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, {
                network: Network.TESTNET.toString() as TonConnectNetwork
            })
        ).rejects.toMatchObject({
            message: 'Invalid network provided',
            code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR
        });
    });

    it('passes when network matches the account (mainnet + mnemonic account)', async () => {
        const wallet = makeWallet();
        mocks.getAccounts.mockResolvedValue([]);
        mocks.getAccountByWalletById.mockReturnValue({ type: 'mnemonic' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, {
                network: Network.MAINNET.toString() as TonConnectNetwork
            })
        ).resolves.toBeUndefined();
    });

    it('passes when network matches the account (testnet + testnet account)', async () => {
        const wallet = makeWallet();
        mocks.getAccounts.mockResolvedValue([]);
        mocks.getAccountByWalletById.mockReturnValue({ type: 'testnet' });

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, {
                network: Network.TESTNET.toString() as TonConnectNetwork
            })
        ).resolves.toBeUndefined();
    });

    it('throws a plain Error when the account cannot be resolved', async () => {
        const wallet = makeWallet();
        mocks.getAccounts.mockResolvedValue([]);
        mocks.getAccountByWalletById.mockReturnValue(undefined);

        await expect(
            checkTonConnectFromAndNetwork(fakeStorage, wallet, {
                network: Network.MAINNET.toString() as TonConnectNetwork
            })
        ).rejects.toThrow('Unknown account provided');
    });

});

describe('checkDappOriginMatchesManifest', () => {
    it('returns true when origin matches the manifest origin', () => {
        expect(
            checkDappOriginMatchesManifest({
                origin: 'https://dedust.io',
                manifestUrl: 'https://dedust.io/tonconnect-manifest.json'
            })
        ).toBe(true);
    });

    it('returns false when localhost origin tries to use a non-localhost manifest', () => {
        expect(
            checkDappOriginMatchesManifest({
                origin: 'http://localhost:3000',
                manifestUrl: 'https://dedust.io'
            })
        ).toBe(false);
    });

    it('returns false when 127.0.0.1 origin tries to use a non-localhost manifest', () => {
        expect(
            checkDappOriginMatchesManifest({
                origin: 'http://127.0.0.1:3000',
                manifestUrl: 'https://dedust.io'
            })
        ).toBe(false);
    });

    it('returns false when the manifest URL is unparseable', () => {
        expect(
            checkDappOriginMatchesManifest({
                origin: 'https://dedust.io',
                manifestUrl: 'not-a-url'
            })
        ).toBe(false);
    });
});

describe('getManifest', () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('rejects a manifest whose declared url origin does not match the hosting origin', async () => {
        const maliciousManifest = {
            url: 'https://getgems.io',
            name: 'Getgems',
            iconUrl: 'https://getgems.io/icon.png'
        };

        fetchSpy.mockResolvedValue({
            status: 200,
            json: async () => maliciousManifest
        } as Response);

        await expect(
            getManifest({
                manifestUrl: 'https://evil.com/tonconnect-manifest.json'
            } as ConnectRequest)
        ).rejects.toThrow('Manifest origin mismatch');
    });

    it('returns the manifest when origin of manifestUrl matches manifest.url', async () => {
        const legitManifest = {
            url: 'https://getgems.io',
            name: 'Getgems',
            iconUrl: 'https://getgems.io/icon.png'
        };

        fetchSpy.mockResolvedValue({
            status: 200,
            json: async () => legitManifest
        } as Response);

        const result = await getManifest({
            manifestUrl: 'https://getgems.io/tonconnect-manifest.json'
        } as ConnectRequest);

        expect(result).toEqual(legitManifest);
    });
});
