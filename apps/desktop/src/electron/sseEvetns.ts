import { TonConnectAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import {
    replyBadRequestResponse,
    replyDisconnectResponse
} from '@tonkeeper/core/dist/service/tonConnect/actionService';
import {
    AccountConnection,
    disconnectAppConnection,
    getTonWalletConnections
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    getLastEventId,
    subscribeTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { Buffer as BufferPolyfill } from 'buffer';
import log from 'electron-log/main';
import EventSourcePolyfill from 'eventsource';
import { MainWindow } from './mainWindow';
import { mainStorage } from './storageService';
import { isStandardTonWallet, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { getWalletById, isAccountControllable } from '@tonkeeper/core/dist/entries/account';

globalThis.Buffer = BufferPolyfill;

export class TonConnectSSE {
    private lastEventId: string;
    private connections: AccountConnection[];
    private dist: Record<string, WalletId>;
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

        const walletsState = (await accountsStorage(mainStorage).getAccounts())
            .filter(isAccountControllable)
            .flatMap(a => a.allTonWallets);

        this.connections = [];
        this.dist = {};

        for (const wallet of walletsState) {
            const walletConnections = await getTonWalletConnections(mainStorage, wallet);

            this.connections = this.connections.concat(walletConnections);
            walletConnections.forEach(item => {
                this.dist[item.clientSessionId] = wallet.id;
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
        const accounts = (await accountsStorage(mainStorage).getAccounts()).filter(
            isAccountControllable
        );
        const wallet = getWalletById(accounts, this.dist[connection.clientSessionId]);

        if (!wallet || !isStandardTonWallet(wallet)) {
            return;
        }

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

                const walletId = this.dist[params.connection.clientSessionId];

                const activeAccount = await accountsStorage(mainStorage).getActiveAccount();
                const activeWallet = activeAccount.activeTonWallet;

                const window = await MainWindow.bringToFront();

                if (activeWallet.id !== walletId) {
                    const accountToActivate = (
                        await accountsStorage(mainStorage).getAccounts()
                    ).find(a => a.getTonWallet(walletId) !== undefined);

                    accountToActivate.setActiveTonWallet(walletId);
                    await accountsStorage(mainStorage).updateAccountInState(accountToActivate);
                    await accountsStorage(mainStorage).setActiveAccountId(accountToActivate.id);
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
