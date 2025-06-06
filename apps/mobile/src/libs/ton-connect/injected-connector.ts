import { CapacitorDappBrowser } from '../plugins/dapp-browser-plugin';
import { NATIVE_BRIDGE_METHODS } from '../../inject-scripts/native-bridge-methods';
import {
    appRequestSchema,
    CONNECT_EVENT_ERROR_CODES,
    ConnectEvent,
    ConnectRequest,
    connectRequestSchema,
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
    saveAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { getWalletById } from '@tonkeeper/core/dist/entries/account';
import { capacitorStorage } from '../appSdk';
import {
    disconnectResponse,
    getBrowserPlatform,
    getDeviceInfo,
    getInjectedDappConnection,
    originFromUrl,
    tonConnectTonkeeperProAppName,
    tonInjectedReConnectRequest
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import packageJson from '../../../package.json';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';
import { BrowserTabIdentifier } from '@tonkeeper/core/dist/service/dappBrowserService';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { z } from 'zod';

function parseBridgeMethodPayload<T extends z.ZodTypeAny>(schema: T, payload: unknown): z.infer<T> {
    const parsed = z
        .object({
            message: schema
        })
        .safeParse(payload);

    if (!parsed.success) {
        console.error('Invalid bridge request payload', parsed.error);
        throw new Error('Invalid bridge request');
    }
    return parsed.data.message;
}

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
            async (rpcParams: Record<string, unknown>, { webViewOrigin }) => {
                const request = parseBridgeMethodPayload(appRequestSchema, rpcParams);

                try {
                    const result = await getInjectedDappConnection(storage, webViewOrigin);
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
                        result.wallet.id
                    );
                } catch (e) {
                    return this.handleRequestExceptions(request.id, e);
                }
            }
        );

        CapacitorDappBrowser.setRequestsHandler(
            NATIVE_BRIDGE_METHODS.TON_CONNECT.CONNECT,
            async (rpcParams: Record<string, unknown>, { webViewOrigin, webViewId }) => {
                try {
                    const request = parseBridgeMethodPayload(connectRequestSchema, rpcParams);

                    const result = await this.connectHandler(request, webViewOrigin);
                    const sameOriginTabs = CapacitorDappBrowser.openedOriginIds(webViewOrigin);
                    await CapacitorDappBrowser.reload({
                        ids: sameOriginTabs.filter(id => id !== webViewId)
                    });
                    return result;
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

    /**
     * 1. Send disconnect event to provide proper behavior for ton_proof dependent dapps (that dapps will reset their backend auth token).
     *    But keep connections saved locally
     * 2. Save new connection with active wallet locally
     * 3. Reload all pages with dapp origin
     *    After reloading dapp will call re-connect method that will restore connection with new active wallet (in case dapp doesn't require ton_proof)
     */
    public async changeConnectedWalletToActive(tab: BrowserTabIdentifier) {
        const dappOrigin = originFromUrl(tab.url);
        if (!dappOrigin) {
            throw new Error('Dapp origin not found');
        }
        const existing = await getInjectedDappConnection(this.storage, dappOrigin);
        if (!existing) {
            throw new Error('Connection not found');
        }
        const existingConnection = existing.connection;
        if (existingConnection.type !== 'injected') {
            throw new Error('Connection type not supported');
        }

        const activeAccount = await accountsStorage(this.storage).getActiveAccount();
        if (!activeAccount) {
            throw new Error('Active account not found');
        }

        await CapacitorDappBrowser.emitEvent(
            tab.id,
            JSON.stringify(disconnectResponse(Date.now().toString()))
        );

        await delay(200);

        /**
         * even in case of connection with wallet exists this will make it actual by changing creation timestamp
         */
        await saveAccountConnection({
            storage: this.storage,
            wallet: activeAccount.activeTonWallet,
            manifest: existingConnection.manifest,
            params: {
                type: 'injected',
                webViewOrigin: existingConnection.webViewOrigin
            }
        });

        await CapacitorDappBrowser.reload({ origin: dappOrigin });
    }

    public sendDisconnect(connection: AccountConnectionInjected | AccountConnectionInjected[]) {
        const connectionsArray = Array.isArray(connection) ? connection : [connection];
        connectionsArray.forEach(c => {
            const ids = CapacitorDappBrowser.openedOriginIds(c.webViewOrigin);

            ids.forEach(id => {
                CapacitorDappBrowser.emitEvent(
                    id,
                    JSON.stringify(disconnectResponse(Date.now().toString()))
                );
            });
        });
    }

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
}

export const tonConnectInjectedConnector = new TonConnectInjectedConnector(capacitorStorage);
