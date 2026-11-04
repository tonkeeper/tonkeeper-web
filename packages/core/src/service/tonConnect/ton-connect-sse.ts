import {
    AccountConnectionHttp,
    disconnectHttpAccountConnection,
    getTonWalletConnections
} from './connectionService';
import { isStandardTonWallet, TonContract, WalletId } from '../../entries/wallet';
import { getLastEventId, subscribeTonConnect } from './httpBridge';
import { accountsStorage } from '../accountsStorage';
import { IStorage } from '../../Storage';
import { TonConnectAppRequest, TonConnectAppRequestPayload } from '../../entries/tonConnect';
import { TonConnectError } from '../../entries/exception';
import { getWalletById } from '../../entries/account';
import { checkTonConnectFromAndNetwork } from './connectService';
import { walletIdOfClientSession } from './sessionOwner';
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

type WalletConnections = {
    wallet: TonContract;
    connections: AccountConnectionHttp[];
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

    private walletsConnections: WalletConnections[] = [];

    private dist: Record<string, WalletId | undefined> = {};

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

        const walletsConnections: WalletConnections[] = [];
        for (const wallet of walletsState) {
            const connections = (await getTonWalletConnections(this.storage, wallet)).filter(
                i => i.type === 'http'
            ) as AccountConnectionHttp[];
            walletsConnections.push({ wallet, connections });
        }

        this.walletsConnections = walletsConnections;
        this.connections = walletsConnections.flatMap(i => i.connections);
        this.dist = {};
        for (const { clientSessionId } of this.connections) {
            this.dist[clientSessionId] = walletIdOfClientSession(
                walletsConnections,
                clientSessionId
            );
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

    private getStandardWalletByClientSessionId = async (clientSessionId: string) => {
        const walletId = this.dist[clientSessionId];
        if (walletId === undefined) {
            return null;
        }

        const accounts = await accountsStorage(this.storage).getAccounts();
        const wallet = getWalletById(accounts, walletId);

        if (!wallet || !isStandardTonWallet(wallet)) {
            return null;
        }

        return wallet;
    };

    private onDisconnect = async ({ connection, request }: TonConnectAppRequest<'http'>) => {
        const owners = this.walletsConnections
            .filter(item =>
                item.connections.some(c => c.clientSessionId === connection.clientSessionId)
            )
            .map(item => item.wallet);
        if (owners.length === 0) {
            return;
        }

        for (const wallet of owners) {
            await disconnectHttpAccountConnection({
                storage: this.storage,
                wallet,
                clientSessionId: connection.clientSessionId
            });
        }
        await replyHttpDisconnectResponse({
            connection,
            request,
            bridgeEndpoint: await this.bridgeEndpoint
        });
        await this.reconnect();
        this.listeners.onDisconnect(connection);
    };

    private selectWallet = async (walletId: WalletId) => {
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
        const replyBadRequest = (message?: string) =>
            this.bridgeEndpoint.then(bridgeEndpoint =>
                replyHttpBadRequestResponse({ ...params, message, bridgeEndpoint })
            );

        const validatePayload = async (
            payload: TonConnectAppRequestPayload['payload']
        ): Promise<WalletId | undefined> => {
            const wallet = await this.getStandardWalletByClientSessionId(
                params.connection.clientSessionId
            );
            if (!wallet) {
                await replyBadRequest('Unknown session');
                return undefined;
            }

            try {
                await checkTonConnectFromAndNetwork(this.storage, wallet, payload);
                return wallet.id;
            } catch (e) {
                await replyBadRequest(e instanceof TonConnectError ? e.message : 'Bad request');
                return undefined;
            }
        };

        switch (params.request.method) {
            case 'disconnect': {
                return this.onDisconnect(params);
            }
            case 'sendTransaction': {
                const payload = JSON.parse(params.request.params[0]);
                const walletId = await validatePayload(payload);
                if (walletId === undefined) {
                    return;
                }
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    walletId,
                    kind: 'sendTransaction',
                    payload
                };
                try {
                    await this.selectWallet(walletId);
                } catch (e) {
                    await replyBadRequest(e instanceof Error ? e.message : 'Bad request');
                    return;
                }
                return this.listeners.onRequest(value);
            }
            case 'signData': {
                const payload = JSON.parse(params.request.params[0]);
                const walletId = await validatePayload(payload);
                if (walletId === undefined) {
                    return;
                }
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    walletId,
                    kind: 'signData',
                    payload
                };
                try {
                    await this.selectWallet(walletId);
                } catch (e) {
                    await replyBadRequest(e instanceof Error ? e.message : 'Bad request');
                    return;
                }
                return this.listeners.onRequest(value);
            }
            default: {
                return replyBadRequest();
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
