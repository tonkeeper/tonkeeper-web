import { CapacitorDappBrowser } from '../plugins/dapp-browser-plugin';
import { NATIVE_BRIDGE_METHODS } from '../../inject-scripts/native-bridge-methods';
import {
    AppRequest,
    CONNECT_EVENT_ERROR_CODES,
    ConnectEvent,
    ConnectRequest,
    RpcMethod,
    SEND_TRANSACTION_ERROR_CODES,
    TonConnectAppRequest,
    TonConnectAppRequestPayload,
    type WalletResponse,
    WalletResponseError
} from '@tonkeeper/core/dist/entries/tonConnect';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import {
    AccountConnectionInjected,
    disconnectInjectedAccountConnection,
    getTonWalletConnections
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { getWalletById } from '@tonkeeper/core/dist/entries/account';
import { capacitorStorage } from '../appSdk';
import {
    disconnectResponse,
    eqOrigins,
    getBrowserPlatform,
    getDeviceInfo,
    tonConnectTonkeeperProAppName,
    tonInjectedReConnectRequest
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import packageJson from '../../../package.json';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';

class TonConnectInjectedConnector {
    private connectHandler: (
        request: ConnectRequest,
        webViewOrigin: string
    ) => Promise<ConnectEvent> = () => {
        throw new Error('Connect handler is not set');
    };

    private requestsHandler: (
        request: TonConnectAppRequestPayload
    ) => Promise<WalletResponse<RpcMethod>> = () => {
        throw new Error('Requests handler is not set');
    };

    private disconnectHandler: (appId: string) => void = () => {
        throw new Error('Disconnect handler is not set');
    };

    setConnectHandler(
        handler: (request: ConnectRequest, webViewOrigin: string) => Promise<ConnectEvent>
    ) {
        this.connectHandler = handler;
    }

    setRequestsHandler(
        handler: (request: TonConnectAppRequestPayload) => Promise<WalletResponse<RpcMethod>>
    ) {
        this.requestsHandler = handler;
    }

    setDisconnectHandler(handler: (appId: string) => void) {
        this.disconnectHandler = handler;
    }

    constructor(private storage: IStorage) {
        CapacitorDappBrowser.setRequestsHandler(
            NATIVE_BRIDGE_METHODS.TON_CONNECT.SEND,
            async (payload: unknown, { webViewOrigin }) => {
                const request = payload as AppRequest<RpcMethod>;
                // TODO zod payload
                try {
                    const result = await this.getConnectionAndWallet(webViewOrigin);
                    if (!result) {
                        return {
                            error: {
                                code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_APP_ERROR,
                                message: 'App does not connected'
                            },
                            id: request.id
                        };
                    }
                    return await this.handleMessage(
                        {
                            connection: result.connection,
                            request
                        },
                        result.wallet
                    );
                } catch (e) {
                    return this.handleRequestExceptions(request.id, e);
                }
            }
        );

        CapacitorDappBrowser.setRequestsHandler(
            NATIVE_BRIDGE_METHODS.TON_CONNECT.CONNECT,
            async (rpcParams: Record<string, unknown>, { webViewOrigin }) => {
                try {
                    // TODO zod payload
                    const validatedRpcParams = rpcParams as { message: ConnectRequest };
                    return await this.connectHandler(validatedRpcParams.message, webViewOrigin);
                } catch (e) {
                    return this.handleConnectExceptions(e);
                }
            }
        );

        CapacitorDappBrowser.setRequestsHandler(
            NATIVE_BRIDGE_METHODS.TON_CONNECT.RESTORE_CONNECTION,
            async (_: unknown, { webViewOrigin }): Promise<ConnectEvent> => {
                try {
                    const { maxMessages, items } = await tonInjectedReConnectRequest(
                        this.storage,
                        webViewOrigin
                    );
                    return {
                        event: 'connect',
                        id: Date.now(),
                        payload: {
                            items,
                            device: getDeviceInfo(
                                getBrowserPlatform(),
                                packageJson.version,
                                maxMessages,
                                tonConnectTonkeeperProAppName
                            )
                        }
                    };
                } catch (e) {
                    return this.handleConnectExceptions(e);
                }
            }
        );
    }

    async handleConnectExceptions(e: unknown): Promise<ConnectEvent> {
        if (e instanceof TonConnectError) {
            return {
                event: 'connect_error',
                id: Date.now(),
                payload: {
                    code: e.code,
                    message: e.message
                }
            };
        } else {
            console.error('Unknown connection error', e);
            return {
                event: 'connect_error',
                id: Date.now(),
                payload: {
                    code: CONNECT_EVENT_ERROR_CODES.UNKNOWN_ERROR,
                    message: 'Unknown error'
                }
            };
        }
    }

    async handleRequestExceptions(
        requestId: string,
        e: unknown
    ): Promise<WalletResponseError<RpcMethod>> {
        if (e instanceof TonConnectError) {
            return {
                error: {
                    code: e.code,
                    message: e.message
                },
                id: requestId
            };
        } else {
            console.error('Unknown ton connect method error', e);
            return {
                error: {
                    code: SEND_TRANSACTION_ERROR_CODES.UNKNOWN_ERROR,
                    message: 'Unknown error'
                },
                id: requestId
            };
        }
    }

    handleMessage = async (params: TonConnectAppRequest<'injected'>, walletId: WalletId) => {
        switch (params.request.method) {
            case 'disconnect': {
                return this.onDisconnect(params, walletId);
            }
            case 'sendTransaction': {
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'sendTransaction',
                    payload: JSON.parse(params.request.params[0])
                };
                await this.selectWallet(walletId);
                return this.requestsHandler(value);
            }
            case 'signData': {
                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'signData',
                    payload: JSON.parse(params.request.params[0])
                };
                await this.selectWallet(walletId);
                return this.requestsHandler(value);
            }
            default: {
                return {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.METHOD_NOT_SUPPORTED,
                        message: `Method ${
                            (params.request as unknown as { method: string }).method
                        } is not supported. Supported methods: sendTransaction, signData, disconnect`
                    },
                    id: (params.request as unknown as { id: string }).id
                };
            }
        }
    };

    private onDisconnect = async (params: TonConnectAppRequest<'injected'>, walletId: WalletId) => {
        const accounts = await accountsStorage(this.storage).getAccounts();
        const wallet = getWalletById(accounts, walletId);

        if (!wallet) {
            return;
        }

        await disconnectInjectedAccountConnection({
            storage: this.storage,
            wallet,
            webViewUrl: params.connection.webViewOrigin
        });
        await this.disconnectHandler(params.connection.webViewOrigin);
        return disconnectResponse(params.request.id);
    };

    private selectWallet = async (walletId: string) => {
        const activeAccount = await accountsStorage(this.storage).getActiveAccount();
        if (!activeAccount) {
            throw new Error('Account not found');
        }
        const activeWallet = activeAccount.activeTonWallet;

        if (activeWallet.id !== walletId) {
            await accountsStorage(this.storage).setActiveAccountAndWalletByWalletId(walletId);
        }
    };

    private async getConnectionAndWallet(origin: string): Promise<{
        connection: AccountConnectionInjected;
        wallet: WalletId;
    } | null> {
        const walletsState = (await accountsStorage(this.storage).getAccounts()).flatMap(
            a => a.allTonWallets
        );

        let connectionAndWallet: {
            connection: AccountConnectionInjected;
            wallet: WalletId;
        } | null = null;

        const checkAccountConnection =
            (id: WalletId) => (connection: AccountConnectionInjected) => {
                if (eqOrigins(connection.webViewOrigin, origin)) {
                    if (connectionAndWallet !== null) {
                        throw new Error('Multiple wallets connected');
                    }
                    connectionAndWallet = { connection, wallet: id };
                }
            };

        for (const wallet of walletsState) {
            const walletConnections = (await getTonWalletConnections(this.storage, wallet)).filter(
                i => i.type === 'injected'
            ) as AccountConnectionInjected[];

            walletConnections.forEach(checkAccountConnection(wallet.id));
        }

        return connectionAndWallet;
    }
}

export const tonConnectInjectedConnector = new TonConnectInjectedConnector(capacitorStorage);
