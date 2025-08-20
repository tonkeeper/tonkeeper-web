import {
    AccountConnectionHttp,
    disconnectHttpAccountConnection,
    getTonWalletConnections
} from './connectionService';
import { isStandardTonWallet, WalletId } from '../../entries/wallet';
import { getLastEventId, subscribeTonConnect } from './httpBridge';
import { accountsStorage } from '../accountsStorage';
import { IStorage } from '../../Storage';
import { TonConnectAppRequest, TonConnectAppRequestPayload } from '../../entries/tonConnect';
import { getWalletById } from '../../entries/account';
import { replyHttpBadRequestResponse, replyHttpDisconnectResponse } from './actionService';
import { delay } from '../../utils/common';
import {
    BootParams,
    defaultTonendpointConfig,
    getServerConfig,
    Tonendpoint
} from '../../tonkeeperApi/tonendpoint';
import { Network } from '../../entries/network';

type Logger = {
    info: (message: string) => void;
};

type System = {
    refresh?: () => void;
    bringToFront?: () => Promise<void>;
    log?: Logger;
};

type Listeners = {
    onDisconnect: (connection: AccountConnectionHttp) => void;
    onRequest: (value: TonConnectAppRequestPayload) => void;
};

export const createBridgeEndpointFetcher =
    ({
        platform,
        onError,
        build
    }: {
        platform: BootParams['platform'];
        build: BootParams['build'];
        onError: (e: unknown) => void;
    }) =>
    async () => {
        try {
            const tonendpoint = new Tonendpoint({
                platform,
                lang: 'en',
                build,
                network: Network.MAINNET
            });
            const config = await getServerConfig(tonendpoint, Network.MAINNET);
            return config.ton_connect_bridge;
        } catch (e) {
            onError(e);
            return defaultTonendpointConfig.ton_connect_bridge;
        }
    };

export class TonConnectSSE {
    private lastEventId: string | undefined;

    private connections: AccountConnectionHttp[] = [];

    private dist: Record<string, WalletId> = {};

    private closeConnection: (() => void) | null = null;

    private readonly storage: IStorage;

    private readonly system: Omit<System, 'log'> & { log: Logger };

    private readonly listeners: Listeners;

    private readonly bridgeEndpoint: Promise<string>;

    public get currentConnections() {
        return this.connections;
    }

    constructor({
        storage,
        listeners,
        bridgeEndpointFetcher,
        system = {}
    }: {
        storage: IStorage;
        listeners: Listeners;
        bridgeEndpointFetcher: () => Promise<string>;
        system?: System;
    }) {
        this.storage = storage;
        this.system = { log: console, ...system };
        this.listeners = listeners;
        this.bridgeEndpoint = bridgeEndpointFetcher();
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
            const walletConnections = (await getTonWalletConnections(this.storage, wallet)).filter(
                i => i.type === 'http'
            ) as AccountConnectionHttp[];

            this.connections = this.connections.concat(walletConnections);
            walletConnections.forEach(item => {
                this.dist[item.clientSessionId] = wallet.id;
            });
        }
    }

    public sendDisconnect = async (connection: AccountConnectionHttp | AccountConnectionHttp[]) => {
        const connectionsToDisconnect = Array.isArray(connection) ? connection : [connection];
        const bridgeEndpoint = await this.bridgeEndpoint;
        await Promise.allSettled(
            connectionsToDisconnect.map((item, index) =>
                replyHttpDisconnectResponse({
                    connection: item,
                    request: { id: (Date.now() + index).toString() },
                    bridgeEndpoint
                })
            )
        );
        await this.reconnect();
    };

    private onDisconnect = async ({ connection, request }: TonConnectAppRequest<'http'>) => {
        const accounts = await accountsStorage(this.storage).getAccounts();
        const wallet = getWalletById(accounts, this.dist[connection.clientSessionId]);

        if (!wallet || !isStandardTonWallet(wallet)) {
            return;
        }

        await disconnectHttpAccountConnection({
            storage: this.storage,
            wallet,
            clientSessionId: connection.clientSessionId
        });
        await replyHttpDisconnectResponse({
            connection,
            request,
            bridgeEndpoint: await this.bridgeEndpoint
        });
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
            await accountsStorage(this.storage).setActiveAccountAndWalletByWalletId(walletId);
            this.system.refresh?.();
            await delay(500);
        }
    };

    private handleMessage = async (params: TonConnectAppRequest<'http'>) => {
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
                    payload: JSON.parse(params.request.params[0])
                };
                await this.selectWallet(params.connection.clientSessionId);
                return this.listeners.onRequest(value);
            }
            default: {
                return replyHttpBadRequestResponse({
                    ...params,
                    bridgeEndpoint: await this.bridgeEndpoint
                });
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
            bridgeEndpoint: await this.bridgeEndpoint
        });
    }

    public destroy() {
        if (this.closeConnection) {
            this.system.log.info('Close connection.');
            this.closeConnection();
        }
    }
}
