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
import { TonConnectError } from '../../entries/exception';
import { getWalletById } from '../../entries/account';
import { checkTonConnectFromAndNetwork } from './connectService';
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

    private getStandardWalletByClientSessionId = async (clientSessionId: string) => {
        const accounts = await accountsStorage(this.storage).getAccounts();
        const wallet = getWalletById(accounts, this.dist[clientSessionId]);

        if (!wallet || !isStandardTonWallet(wallet)) {
            return null;
        }

        return wallet;
    };

    private onDisconnect = async ({ connection, request }: TonConnectAppRequest<'http'>) => {
        const wallet = await this.getStandardWalletByClientSessionId(connection.clientSessionId);
        if (!wallet) {
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
        const replyBadRequest = (message?: string) =>
            this.bridgeEndpoint.then(bridgeEndpoint =>
                replyHttpBadRequestResponse({ ...params, message, bridgeEndpoint })
            );

        const validatePayload = async (
            payload: TonConnectAppRequestPayload['payload']
        ): Promise<boolean> => {
            const wallet = await this.getStandardWalletByClientSessionId(
                params.connection.clientSessionId
            );
            if (!wallet) {
                await replyBadRequest('Unknown session');
                return false;
            }

            try {
                await checkTonConnectFromAndNetwork(this.storage, wallet, payload);
                return true;
            } catch (e) {
                await replyBadRequest(e instanceof TonConnectError ? e.message : 'Bad request');
                return false;
            }
        };

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
                if (!(await validatePayload(value.payload))) {
                    return;
                }
                try {
                    await this.selectWallet(params.connection.clientSessionId);
                } catch (e) {
                    await replyBadRequest(e instanceof Error ? e.message : 'Bad request');
                    return;
                }
                return this.listeners.onRequest(value);
            }
            case 'signData': {
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'signData',
                    payload: JSON.parse(params.request.params[0])
                };
                if (!(await validatePayload(value.payload))) {
                    return;
                }
                try {
                    await this.selectWallet(params.connection.clientSessionId);
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
