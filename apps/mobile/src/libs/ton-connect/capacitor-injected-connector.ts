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
    signDataRequestPayloadSchema,
    TonConnectAppRequest,
    TonConnectAppRequestPayload,
    TonConnectNetwork,
    transactionRequestPayloadSchema,
    type WalletResponse,
    WalletResponseError
} from '@tonkeeper/core/dist/entries/tonConnect';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { eqRawAddresses, TonContract, WalletId } from '@tonkeeper/core/dist/entries/wallet';
import {
    AccountConnectionInjected,
    saveAccountConnection
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { getAccountByWalletById, getWalletById } from '@tonkeeper/core/dist/entries/account';
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
import { z } from 'zod';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { QueryClient } from '@tanstack/react-query';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { queryClient as queryClientInstance } from '../query-client';

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

class CapacitorTonConnectInjectedConnector {
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

    constructor(private storage: IStorage, private queryClient: QueryClient) {
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
                                message: 'App is not connected'
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

    handleMessage = async (params: TonConnectAppRequest<'injected'>, wallet: TonContract) => {
        switch (params.request.method) {
            case 'disconnect': {
                return this.onDisconnect(params, wallet.id);
            }
            case 'sendTransaction': {
                const payload = transactionRequestPayloadSchema.parse(
                    JSON.parse(params.request.params[0])
                );
                const error = await this.checkFromAndNetwork(wallet, {
                    from: payload.from,
                    network: payload.network,
                    requestId: params.request.id
                });

                if (error) {
                    return error;
                }

                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'sendTransaction',
                    payload
                };
                await this.selectWallet(wallet.id);
                return this.requestsHandler(value);
            }
            case 'signData': {
                const payload = signDataRequestPayloadSchema.parse(
                    JSON.parse(params.request.params[0])
                );
                const error = await this.checkFromAndNetwork(wallet, {
                    from: payload.from,
                    network: payload.network,
                    requestId: params.request.id
                });

                if (error) {
                    return error;
                }

                const value: TonConnectAppRequestPayload = {
                    connection: params.connection,
                    id: params.request.id,
                    kind: 'signData',
                    payload
                };
                await this.selectWallet(wallet.id);
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

    private async checkFromAndNetwork(
        wallet: TonContract,
        params: { from?: string; network?: TonConnectNetwork; requestId?: string }
    ) {
        if (params.from !== undefined) {
            if (!eqRawAddresses(wallet.rawAddress, params.from)) {
                return {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: 'Invalid account provided'
                    },
                    id: params.requestId
                };
            }
        }

        if (params.network !== undefined) {
            const account = getAccountByWalletById(
                await accountsStorage(this.storage).getAccounts(),
                wallet.id
            );

            if (!account) {
                throw new Error('Unknown account provided');
            }

            const mismatchMainnet =
                params.network.toString() === Network.MAINNET.toString() &&
                account.type === 'testnet';
            const mismatchTestnet =
                params.network.toString() === Network.TESTNET.toString() &&
                account.type !== 'testnet';

            if (mismatchMainnet && mismatchTestnet) {
                return {
                    error: {
                        code: SEND_TRANSACTION_ERROR_CODES.BAD_REQUEST_ERROR,
                        message: 'Invalid network provided'
                    },
                    id: params.requestId
                };
            }
        }
    }

    /**
     * 1. Ignore dapps that require ton_proof. Works only for dapps without ton_proof
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

        if (existingConnection.connectItems.some(i => i.name === 'ton_proof')) {
            throw new Error('Ton proof reconnection is not supported');
        }

        /**
         * even in case of connection with wallet exists this will make it actual by changing creation timestamp
         */
        await saveAccountConnection({
            storage: this.storage,
            wallet: activeAccount.activeTonWallet,
            manifest: existingConnection.manifest,
            params: {
                type: 'injected',
                webViewOrigin: existingConnection.webViewOrigin,
                request: {
                    items: existingConnection.connectItems
                }
            }
        });
        await this.queryClient.invalidateQueries([QueryKey.tonConnectConnection]);

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

export const capacitorTonConnectInjectedConnector = new CapacitorTonConnectInjectedConnector(
    capacitorStorage,
    queryClientInstance
);
