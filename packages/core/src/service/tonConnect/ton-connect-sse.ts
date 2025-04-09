import {
    AccountConnection,
    disconnectAppConnection,
    getTonWalletConnections
} from './connectionService';
import { isStandardTonWallet, WalletId } from '../../entries/wallet';
import { getLastEventId, subscribeTonConnect } from './httpBridge';
import { accountsStorage } from '../accountsStorage';
import { IStorage } from '../../Storage';
import {
    SendTransactionAppRequest,
    TonConnectAppRequest,
    TonConnectAppRequestPayload
} from '../../entries/tonConnect';
import { getWalletById } from '../../entries/account';
import { replyBadRequestResponse, replyDisconnectResponse } from './actionService';
import { delay } from '../../utils/common';

type Logger = {
    info: (message: string) => void;
};

type System = {
    refresh?: () => void;
    bringToFront?: () => Promise<void>;
    log?: Logger;
};

type Listeners = {
    onDisconnect: (connection: AccountConnection) => void;
    onRequest: (value: TonConnectAppRequestPayload) => void;
};

export class TonConnectSSE {
    private lastEventId: string | undefined;

    private connections: AccountConnection[] = [];

    private dist: Record<string, WalletId> = {};

    private closeConnection: (() => void) | null = null;

    private readonly storage: IStorage;

    private readonly EventSourcePolyfill: typeof EventSource;

    private readonly system: Omit<System, 'log'> & { log: Logger };

    private readonly listeners: Listeners;

    public get currentConnections() {
        return this.connections;
    }

    constructor({
        storage,
        listeners,
        EventSourcePolyfill = EventSource,
        system = {}
    }: {
        storage: IStorage;
        listeners: Listeners;
        EventSourcePolyfill?: typeof EventSource;
        system?: System;
    }) {
        this.storage = storage;
        this.EventSourcePolyfill = EventSourcePolyfill;
        this.system = { log: console, ...system };
        this.listeners = listeners;
        this.reconnect();
    }

    public async reconnect() {
        this.system.log.info('Reconnect.');
        await this.init();
        return this.connect();
    }

    public async init() {
        this.lastEventId = await getLastEventId(this.storage);

        const walletsState = (await accountsStorage(this.storage).getAccounts()).flatMap(
            a => a.allTonWallets
        );

        this.connections = [];
        this.dist = {};

        for (const wallet of walletsState) {
            const walletConnections = await getTonWalletConnections(this.storage, wallet);

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
        const accounts = await accountsStorage(this.storage).getAccounts();
        const wallet = getWalletById(accounts, this.dist[connection.clientSessionId]);

        if (!wallet || !isStandardTonWallet(wallet)) {
            return;
        }

        await disconnectAppConnection({
            storage: this.storage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyDisconnectResponse({ connection, request });
        await this.reconnect();
        this.listeners.onDisconnect(connection);
    };

    private selectWallet = async (clientSessionId: string) => {
        const walletId = this.dist[clientSessionId];

        const activeAccount = await accountsStorage(this.storage).getActiveAccount();
        if (!activeAccount) {
            throw new Error('Account not found');
        }
        const activeWallet = activeAccount.activeTonWallet;

        await this.system.bringToFront?.();

        if (activeWallet.id !== walletId) {
            const accountToActivate = (await accountsStorage(this.storage).getAccounts()).find(
                a => a.getTonWallet(walletId) !== undefined
            );

            if (!accountToActivate) {
                throw new Error('Account not found');
            }

            accountToActivate.setActiveTonWallet(walletId);
            await accountsStorage(this.storage).updateAccountInState(accountToActivate);
            await accountsStorage(this.storage).setActiveAccountId(accountToActivate.id);
            this.system.refresh?.();
            await delay(500);
        }
    };
    private handleMessage = async (params: TonConnectAppRequest) => {
        switch (params.request.method) {
            case 'disconnect': {
                return this.onDisconnect(params);
            }
            case 'sendTransaction': {
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'sendTransaction',
                    payload: JSON.parse(params.request.params[0])
                };
                await this.selectWallet(params.connection.clientSessionId);
                return this.listeners.onRequest(value);
            }
            case 'signData': {
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'signData',
                    payload: params.request.params
                };
                await this.selectWallet(params.connection.clientSessionId);
                return this.listeners.onRequest(value);
            }
            default: {
                return replyBadRequestResponse(params);
            }
        }
    };

    public async connect() {
        this.destroy();
        if (this.connections.length === 0) {
            this.system.log.info('Missing connection.');
        }
        this.closeConnection = subscribeTonConnect({
            storage: this.storage,
            handleMessage: this.handleMessage,
            connections: this.connections,
            lastEventId: this.lastEventId,
            EventSourceClass: this.EventSourcePolyfill
        });
    }

    public destroy() {
        if (this.closeConnection) {
            this.system.log.info('Close connection.');
            this.closeConnection();
        }
    }
}
