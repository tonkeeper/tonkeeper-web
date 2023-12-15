import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import { getAccountState } from '@tonkeeper/core/dist/service/accountService';
import {
    replyBadRequestResponse,
    replyDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import {
    disconnectAppConnection,
    getAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    getLastEventId,
    subscribeTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { getWalletState } from '@tonkeeper/core/dist/service/wallet/storeService';
import { Buffer as BufferPolyfill } from 'buffer';
import { BrowserWindow } from 'electron';
import EventSourcePolyfill from 'eventsource';
import { mainStorage } from './storageService';

declare var Buffer: typeof BufferPolyfill;
globalThis.Buffer = BufferPolyfill;

export const subscribeSSE = async (mainWindow: BrowserWindow) => {
    const account = await getAccountState(mainStorage);
    if (!account.activePublicKey) return null;
    const wallet = await getWalletState(mainStorage, account.activePublicKey);

    const lastEventId = await getLastEventId(mainStorage);
    const connections = await getAccountConnection(mainStorage, wallet);

    const disconnect = async ({ connection, request }: TonConnectAppRequest) => {
        await disconnectAppConnection({
            storage: mainStorage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyDisconnectResponse({ connection, request });
    };

    const handleMessage = (params: TonConnectAppRequest) => {
        switch (params.request.method) {
            case 'disconnect': {
                return disconnect(params);
            }
            case 'sendTransaction': {
                const value = {
                    connection: params.connection,
                    id: params.request.id,
                    payload: JSON.parse(params.request.params[0])
                };

                console.log(value);

                mainWindow.show();
                setTimeout(() => {
                    mainWindow.webContents.send('sendTransaction', value);
                }, 100);
                return;
            }
            default: {
                return replyBadRequestResponse(params);
            }
        }
    };

    const close = subscribeTonConnect({
        storage: mainStorage,
        handleMessage,
        connections: connections,
        lastEventId: lastEventId,
        EventSourceClass: EventSourcePolyfill as any
    });

    return close;
};
