/* eslint-disable import/no-extraneous-dependencies */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SEND_TRANSACTION_ERROR_CODES } from '../../../entries/tonConnect';
import type { AccountConnectionHttp } from '../connectionService';

const mocks = vi.hoisted(() => ({
    sendEventToBridge: vi.fn()
}));

vi.mock('../httpBridge', () => ({
    sendEventToBridge: mocks.sendEventToBridge
}));

vi.mock('../../accountsStorage', () => ({
    accountsStorage: () => ({
        getAccounts: vi.fn(async () => [])
    })
}));

const { replyHttpBadRequestResponse, replyHttpDisconnectResponse } = await import(
    '../actionService'
);

const bridgeEndpoint = 'https://bridge.example.com';

const connection: AccountConnectionHttp = {
    id: 'manifest.example.com',
    type: 'http',
    manifest: {
        url: 'https://example.com',
        name: 'Example',
        iconUrl: 'https://example.com/icon.png'
    },
    sessionKeyPair: {
        publicKey: 'pub',
        secretKey: 'sec'
    },
    clientSessionId: 'client-session-id',
    connectItems: []
};

describe('replyHttpBadRequestResponse', () => {
    beforeEach(() => {
        mocks.sendEventToBridge.mockReset();
        mocks.sendEventToBridge.mockResolvedValue(undefined);
    });

    it('sends a bad request with the default message when no custom message is provided', async () => {
        await replyHttpBadRequestResponse({
            connection,
            request: { id: 'req-1', method: 'sendTransaction' },
            bridgeEndpoint
        });

        expect(mocks.sendEventToBridge).toHaveBeenCalledTimes(1);
        const [args] = mocks.sendEventToBridge.mock.calls[0];
        expect(args).toMatchObject({
            response: {
                id: 'req-1',
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                    message: 'Method "sendTransaction" is not supported by the wallet app'
                }
            },
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId: connection.clientSessionId,
            bridgeEndpoint
        });
    });

    it('forwards a custom message to the bridge', async () => {
        await replyHttpBadRequestResponse({
            connection,
            request: { id: 'req-2', method: 'sendTransaction' },
            message: 'Invalid account provided',
            bridgeEndpoint
        });

        const [args] = mocks.sendEventToBridge.mock.calls[0];
        expect(args.response).toEqual({
            id: 'req-2',
            error: {
                code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                message: 'Invalid account provided'
            }
        });
    });
});

describe('replyHttpDisconnectResponse', () => {
    beforeEach(() => {
        mocks.sendEventToBridge.mockReset();
        mocks.sendEventToBridge.mockResolvedValue(undefined);
    });

    it('sends a disconnect event keyed by the request id', async () => {
        await replyHttpDisconnectResponse({
            connection,
            request: { id: 'req-x' },
            bridgeEndpoint
        });

        const [args] = mocks.sendEventToBridge.mock.calls[0];
        expect(args).toMatchObject({
            response: { event: 'disconnect', id: 'req-x', payload: {} },
            clientSessionId: connection.clientSessionId,
            bridgeEndpoint
        });
    });
});
