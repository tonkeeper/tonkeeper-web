import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import { getAccountState } from '@tonkeeper/core/dist/service/accountService';
import {
    replyBadRequestResponse,
    replyDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import {
    AccountConnection,
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

globalThis.Buffer = BufferPolyfill;

export class TonConnectSSE {
    private lastEventId: string;
    private connections: AccountConnection[];
    private dist: Record<string, string>;
    private closeConnection: () => void | null = null;

    private static instance: TonConnectSSE = null;

    static getInstance(mainWindow: BrowserWindow) {
        if (this.instance != null) return this.instance;
        return (this.instance = new TonConnectSSE(mainWindow));
    }

    constructor(private mainWindow: BrowserWindow) {
        this.reconnect();
    }

    public reconnect() {
        console.log('reconnect');
        return this.init().then(() => this.connect());
    }

    public async init() {
        this.lastEventId = await getLastEventId(mainStorage);

        const account = await getAccountState(mainStorage);

        this.connections = [];
        this.dist = {};

        for (let key of account.publicKeys) {
            const wallet = await getWalletState(mainStorage, key);
            const walletConnections = await getAccountConnection(mainStorage, wallet);

            this.connections = this.connections.concat(walletConnections);
            walletConnections.forEach(item => {
                this.dist[item.clientSessionId] = key;
            });
        }
    }

    private disconnect = async ({ connection, request }: TonConnectAppRequest) => {
        const wallet = await getWalletState(mainStorage, this.dist[connection.clientSessionId]);
        await disconnectAppConnection({
            storage: mainStorage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyDisconnectResponse({ connection, request });
        await this.reconnect();
    };

    private handleMessage = (params: TonConnectAppRequest) => {
        switch (params.request.method) {
            case 'disconnect': {
                return this.disconnect(params);
            }
            case 'sendTransaction': {
                const value = {
                    connection: params.connection,
                    id: params.request.id,
                    payload: JSON.parse(params.request.params[0])
                };

                this.mainWindow.show();
                setTimeout(() => {
                    this.mainWindow.webContents.send('sendTransaction', value);
                }, 200);
                return;
            }
            default: {
                return replyBadRequestResponse(params);
            }
        }
    };

    public async connect() {
        this.destroy();
        this.closeConnection = subscribeTonConnect({
            storage: mainStorage,
            handleMessage: this.handleMessage,
            connections: this.connections,
            lastEventId: this.lastEventId,
            EventSourceClass: EventSourcePolyfill as any
        });
    }

    public destroy() {
        if (this.closeConnection) {
            this.closeConnection();
        }
    }
}
