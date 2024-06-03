import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import { accountSelectWallet, getAccountState } from '@tonkeeper/core/dist/service/accountService';
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
import { delay } from '@tonkeeper/core/dist/utils/common';
import { Buffer as BufferPolyfill } from 'buffer';
import log from 'electron-log/main';
import EventSourcePolyfill from 'eventsource';
import { MainWindow } from './mainWindow';
import { mainStorage } from './storageService';

globalThis.Buffer = BufferPolyfill;

export class TonConnectSSE {
    private lastEventId: string;
    private connections: AccountConnection[];
    private dist: Record<string, string>;
    private closeConnection: () => void | null = null;

    private static instance: TonConnectSSE = null;

    static getInstance() {
        if (this.instance != null) return this.instance;
        return (this.instance = new TonConnectSSE());
    }

    constructor() {
        this.reconnect();
    }

    public reconnect() {
        log.info('Reconnect.');
        return this.init().then(() => this.connect());
    }

    public async init() {
        this.lastEventId = await getLastEventId(mainStorage);

        const account = await getAccountState(mainStorage);

        this.connections = [];
        this.dist = {};

        for (const key of account.publicKeys) {
            const wallet = await getWalletState(mainStorage, key);
            const walletConnections = await getAccountConnection(mainStorage, wallet);

            this.connections = this.connections.concat(walletConnections);
            walletConnections.forEach(item => {
                this.dist[item.clientSessionId] = key;
            });
        }
    }

    public sendDisconnect = async (connection: AccountConnection | AccountConnection[]) => {
        const connectionsToDisconnect = Array.isArray(connection) ? connection : [connection];
        await Promise.allSettled(
            connectionsToDisconnect.map((item, index) =>
                replyDisconnectResponse({
                    connection: item,
                    request: { id: (Date.now() + index).toString() }
                })
            )
        );
        await this.reconnect();
    };

    private onDisconnect = async ({ connection, request }: TonConnectAppRequest) => {
        const wallet = await getWalletState(mainStorage, this.dist[connection.clientSessionId]);
        await disconnectAppConnection({
            storage: mainStorage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyDisconnectResponse({ connection, request });
        await this.reconnect();
        MainWindow.mainWindow.webContents.send('disconnect', connection);
    };

    private handleMessage = async (params: TonConnectAppRequest) => {
        switch (params.request.method) {
            case 'disconnect': {
                return this.onDisconnect(params);
            }
            case 'sendTransaction': {
                const value = {
                    connection: params.connection,
                    id: params.request.id,
                    payload: JSON.parse(params.request.params[0])
                };

                const walletPublicKey = this.dist[params.connection.clientSessionId];

                const account = await getAccountState(mainStorage);

                const window = await MainWindow.bringToFront();

                if (account.activePublicKey !== walletPublicKey) {
                    await accountSelectWallet(mainStorage, walletPublicKey);
                    window.webContents.send('refresh');
                    await delay(500);
                }

                window.webContents.send('sendTransaction', value);
                return;
            }
            default: {
                return replyBadRequestResponse(params);
            }
        }
    };

    public async connect() {
        this.destroy();
        if (this.connections.length === 0) {
            log.info('Missing connection.');
        }
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
            log.info('Close connection.');
            this.closeConnection();
        }
    }
}
