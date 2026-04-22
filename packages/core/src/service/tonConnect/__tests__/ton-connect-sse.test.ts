/* eslint-disable import/no-extraneous-dependencies */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TonConnectError } from '../../../entries/exception';
import {
    SEND_TRANSACTION_ERROR_CODES,
    TonConnectAppRequest
} from '../../../entries/tonConnect';
import type { IStorage } from '../../../Storage';
import type { AccountConnectionHttp } from '../connectionService';

/**
 * Tests for the `TonConnectSSE` class, in particular `handleMessage`
 * For an http bridge request we want to:
 *
 *   1. reject (via replyHttpBadRequestResponse) if the client session is unknown,
 *   2. reject if `checkTonConnectFromAndNetwork` fails (wrong from / wrong network),
 *   3. reject if selecting the wallet throws,
 *   4. only then forward the payload to `listeners.onRequest`.
 *
 * We pierce the SSE transport by mocking `subscribeTonConnect` — it captures
 * `handleMessage` so tests can invoke it directly.
 */

type HandleMessage = (params: TonConnectAppRequest<'http'>) => Promise<void>;

const mocks = vi.hoisted(() => ({
    getAccounts: vi.fn(),
    getActiveAccount: vi.fn(),
    setActiveAccountAndWalletByWalletId: vi.fn(async () => {}),
    getTonWalletConnections: vi.fn(),
    getWalletById: vi.fn(),
    isStandardTonWallet: vi.fn(),
    checkTonConnectFromAndNetwork: vi.fn(),
    replyHttpBadRequestResponse: vi.fn(async () => {}),
    replyHttpDisconnectResponse: vi.fn(async () => {}),
    disconnectHttpAccountConnection: vi.fn(async () => {}),
    subscribeTonConnect: vi.fn(),
    getLastEventId: vi.fn(async () => undefined),
    sendEventToBridge: vi.fn(async () => {})
}));

vi.mock('../../accountsStorage', () => ({
    accountsStorage: () => ({
        getAccounts: mocks.getAccounts,
        getActiveAccount: mocks.getActiveAccount,
        setActiveAccountAndWalletByWalletId: mocks.setActiveAccountAndWalletByWalletId
    })
}));

vi.mock('../connectionService', () => ({
    getTonWalletConnections: mocks.getTonWalletConnections,
    disconnectHttpAccountConnection: mocks.disconnectHttpAccountConnection
}));

vi.mock('../../../entries/account', async () => {
    const actual = await vi.importActual<typeof import('../../../entries/account')>(
        '../../../entries/account'
    );
    return {
        ...actual,
        getWalletById: mocks.getWalletById
    };
});

vi.mock('../../../entries/wallet', async () => {
    const actual = await vi.importActual<typeof import('../../../entries/wallet')>(
        '../../../entries/wallet'
    );
    return {
        ...actual,
        isStandardTonWallet: mocks.isStandardTonWallet
    };
});

vi.mock('../connectService', () => ({
    checkTonConnectFromAndNetwork: mocks.checkTonConnectFromAndNetwork
}));

vi.mock('../actionService', () => ({
    replyHttpBadRequestResponse: mocks.replyHttpBadRequestResponse,
    replyHttpDisconnectResponse: mocks.replyHttpDisconnectResponse
}));

vi.mock('../httpBridge', () => ({
    subscribeTonConnect: mocks.subscribeTonConnect,
    getLastEventId: mocks.getLastEventId,
    sendEventToBridge: mocks.sendEventToBridge
}));

vi.mock('../../../utils/common', async () => {
    const actual = await vi.importActual<typeof import('../../../utils/common')>(
        '../../../utils/common'
    );
    return {
        ...actual,
        delay: vi.fn(async () => {})
    };
});

const { TonConnectSSE } = await import('../ton-connect-sse');

const bridgeEndpoint = 'https://bridge.example.com';
const walletId = 'wallet-1';
const clientSessionId = 'abcd1234';

const makeConnection = (): AccountConnectionHttp => ({
    id: 'manifest.example.com',
    type: 'http',
    manifest: {
        url: 'https://example.com',
        name: 'Example',
        iconUrl: 'https://example.com/icon.png'
    },
    sessionKeyPair: { publicKey: 'pub', secretKey: 'sec' },
    clientSessionId,
    connectItems: []
});

const makeWallet = (rawAddress = '0:abc') => ({
    id: walletId,
    rawAddress,
    publicKey: 'public-key'
});

const makeSendTransactionRequest = (
    payload: Record<string, unknown> = { messages: [] }
): TonConnectAppRequest<'http'> => ({
    connection: makeConnection(),
    request: {
        id: 'req-1',
        method: 'sendTransaction',
        params: [JSON.stringify(payload)]
    }
});

const makeSignDataRequest = (
    payload: Record<string, unknown> = { type: 'text', text: 'hello' }
): TonConnectAppRequest<'http'> => ({
    connection: makeConnection(),
    request: {
        id: 'req-2',
        method: 'signData',
        params: [JSON.stringify(payload)]
    }
});

const fakeStorage = {} as IStorage;

const setupSse = async ({
    onRequest = vi.fn(),
    onDisconnect = vi.fn()
}: {
    onRequest?: ReturnType<typeof vi.fn>;
    onDisconnect?: ReturnType<typeof vi.fn>;
} = {}) => {
    let capturedHandleMessage: HandleMessage | null = null;
    mocks.subscribeTonConnect.mockImplementation(({ handleMessage }) => {
        capturedHandleMessage = handleMessage;
        return () => {};
    });

    const sse = new TonConnectSSE({
        storage: fakeStorage,
        listeners: { onRequest, onDisconnect },
        bridgeEndpointFetcher: async () => bridgeEndpoint,
        system: { log: { info: vi.fn() } }
    });

    // wait for the constructor-triggered `reconnect()` -> `init()` -> `connect()` chain
    await vi.waitFor(() => {
        if (!capturedHandleMessage) throw new Error('handleMessage not captured yet');
    });

    return {
        sse,
        handleMessage: capturedHandleMessage!,
        onRequest,
        onDisconnect
    };
};

describe('TonConnectSSE.handleMessage', () => {
    beforeEach(() => {
        Object.values(mocks).forEach(fn => 'mockReset' in fn && fn.mockReset());
        mocks.getAccounts.mockResolvedValue([
            { allTonWallets: [{ id: walletId, publicKey: 'public-key' }] }
        ]);
        mocks.getTonWalletConnections.mockResolvedValue([makeConnection()]);
        mocks.getWalletById.mockReturnValue(makeWallet());
        mocks.isStandardTonWallet.mockReturnValue(true);
        mocks.checkTonConnectFromAndNetwork.mockResolvedValue(undefined);
        mocks.getActiveAccount.mockResolvedValue({ activeTonWallet: { id: walletId } });
        mocks.getLastEventId.mockResolvedValue(undefined);
    });

    describe('sendTransaction', () => {
        it('forwards to listeners.onRequest when validation passes', async () => {
            const { handleMessage, onRequest } = await setupSse();
            const payload = { messages: [{ address: '0:dead', amount: '1' }] };

            await handleMessage(makeSendTransactionRequest(payload));

            expect(mocks.checkTonConnectFromAndNetwork).toHaveBeenCalledWith(
                fakeStorage,
                expect.objectContaining({ id: walletId }),
                payload
            );
            expect(onRequest).toHaveBeenCalledTimes(1);
            expect(onRequest).toHaveBeenCalledWith({
                connection: expect.objectContaining({ clientSessionId }),
                id: 'req-1',
                kind: 'sendTransaction',
                payload
            });
            expect(mocks.replyHttpBadRequestResponse).not.toHaveBeenCalled();
        });

        it('rejects the request and never calls listeners.onRequest when from/network check fails', async () => {
            mocks.checkTonConnectFromAndNetwork.mockRejectedValue(
                new TonConnectError(
                    'Invalid account provided',
                    SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR
                )
            );

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(
                makeSendTransactionRequest({
                    from: '0:deadbeef',
                    messages: []
                })
            );

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledTimes(1);
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid account provided',
                    bridgeEndpoint,
                    request: expect.objectContaining({ method: 'sendTransaction' })
                })
            );
        });

        it('rejects with a generic "Bad request" message for non-TonConnect errors', async () => {
            mocks.checkTonConnectFromAndNetwork.mockRejectedValue(new Error('boom'));

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(makeSendTransactionRequest());

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Bad request' })
            );
        });

        it('rejects when the client session id is unknown (no wallet in dist map)', async () => {
            mocks.getWalletById.mockReturnValue(undefined);

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(makeSendTransactionRequest());

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.checkTonConnectFromAndNetwork).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Unknown session' })
            );
        });

        it('rejects without calling onRequest when selectWallet throws', async () => {
            mocks.getActiveAccount.mockResolvedValue(null);

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(makeSendTransactionRequest());

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Account not found' })
            );
        });

    });

    describe('signData', () => {
        it('forwards to listeners.onRequest when validation passes', async () => {
            const { handleMessage, onRequest } = await setupSse();
            const payload = { type: 'text', text: 'hello' };

            await handleMessage(makeSignDataRequest(payload));

            expect(mocks.checkTonConnectFromAndNetwork).toHaveBeenCalledWith(
                fakeStorage,
                expect.objectContaining({ id: walletId }),
                payload
            );
            expect(onRequest).toHaveBeenCalledWith(
                expect.objectContaining({ kind: 'signData', payload })
            );
            expect(mocks.replyHttpBadRequestResponse).not.toHaveBeenCalled();
        });

        it('rejects when from does not match the wallet and never opens the prompt', async () => {
            mocks.checkTonConnectFromAndNetwork.mockRejectedValue(
                new TonConnectError(
                    'Invalid account provided',
                    SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR
                )
            );

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(
                makeSignDataRequest({
                    type: 'text',
                    text: 'hi',
                    from: '0:other'
                })
            );

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: 'Invalid account provided',
                    request: expect.objectContaining({ method: 'signData' })
                })
            );
        });

        it('rejects with "Unknown session" when no wallet resolves for the client session id', async () => {
            mocks.getWalletById.mockReturnValue(undefined);

            const { handleMessage, onRequest } = await setupSse();

            await handleMessage(makeSignDataRequest());

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({ message: 'Unknown session' })
            );
        });
    });

    describe('unknown methods', () => {
        it('responds with a default bad request for unsupported methods', async () => {
            const { handleMessage, onRequest } = await setupSse();

            await handleMessage({
                connection: makeConnection(),
                request: {
                    id: 'req-x',
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    method: 'unsupportedMethod' as any,
                    params: ['{}']
                }
            } as TonConnectAppRequest<'http'>);

            expect(onRequest).not.toHaveBeenCalled();
            expect(mocks.checkTonConnectFromAndNetwork).not.toHaveBeenCalled();
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledTimes(1);
            expect(mocks.replyHttpBadRequestResponse).toHaveBeenCalledWith(
                expect.objectContaining({
                    message: undefined,
                    bridgeEndpoint,
                    request: expect.objectContaining({ method: 'unsupportedMethod' })
                })
            );
        });
    });
});
