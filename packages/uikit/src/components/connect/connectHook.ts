import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    ConnectEvent,
    DAppManifest,
    RpcMethod,
    TonConnectEventPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    parseTonTransaction,
    parseTronTransferWithAddress,
    seeIfBringToFrontLink
} from '@tonkeeper/core/dist/service/deeplinkingService';
import {
    connectErrorResponse,
    parseTonConnect,
    saveWalletTonConnect,
    tonConnectUserRejectError
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnectionHttp,
    TonConnectHttpConnectionParams,
    TonConnectInjectedConnectionParams
} from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { sendEventToBridge } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useToast } from '../../hooks/useNotification';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useTonTransactionNotification } from '../modals/TonTransactionNotificationControlled';
import { useActiveApi, useActiveWallet } from '../../state/wallet';
import { useBatteryServiceConfig } from '../../state/battery';
import { useGaslessConfig } from '../../state/gasless';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';

export const useProcessOpenedLink = (options?: {
    hideLoadingToast?: boolean;
    hideErrorToast?: boolean;
}) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const notifyError = useToast();
    const { onOpen: openTransactionNotification } = useTonTransactionNotification();
    const api = useActiveApi();
    const walletAddress = useActiveWallet().rawAddress;
    const batteryConfig = useBatteryServiceConfig();
    const gaslessConfig = useGaslessConfig();

    return useMutation<null | TonConnectHttpConnectionParams, Error, string>(async url => {
        try {
            const bring = seeIfBringToFrontLink({ url });
            if (bring != null) {
                // TODO: save ret parameter and user after confirm transaction
                return null;
            }

            const showLoadingToast = () => {
                if (!options?.hideLoadingToast) {
                    sdk.uiEvents.emit('copy', {
                        method: 'copy',
                        id: Date.now(),
                        params: t('loading')
                    });
                }
            };

            const transactionRequest = await parseTonTransaction(url, {
                api,
                walletAddress,
                batteryResponse: batteryConfig.excessAccount,
                gaslessResponse: gaslessConfig.relayAddress
            });
            if (transactionRequest) {
                if (transactionRequest.type === 'complex') {
                    openTransactionNotification({
                        params: transactionRequest.params
                    });
                } else {
                    showLoadingToast();

                    sdk.uiEvents.emit('transfer', {
                        method: 'transfer',
                        id: Date.now(),
                        params: {
                            chain: BLOCKCHAIN_NAME.TON,
                            ...transactionRequest.params,
                            from: 'qr-code'
                        }
                    });
                }
                return null;
            }

            const tronTransfer = parseTronTransferWithAddress({ url });
            if (tronTransfer) {
                showLoadingToast();

                sdk.uiEvents.emit('transfer', {
                    method: 'transfer',
                    id: Date.now(),
                    params: { chain: BLOCKCHAIN_NAME.TRON, ...tronTransfer, from: 'qr-code' }
                });
                return null;
            }

            const params = parseTonConnect({ url });

            if (typeof params === 'string') {
                console.error(params);
                throw new Error('Unsupported link');
            }

            showLoadingToast();

            return params;
        } catch (e) {
            if (!options?.hideErrorToast) {
                notifyError(String(e).replace(/^Error ?: ?/, ''));
            }
            throw e;
        }
    });
};

export const useCompleteHttpConnection = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        undefined,
        Error,
        {
            params: TonConnectHttpConnectionParams;
            result:
                | {
                      replyItems: TonConnectEventPayload;
                      manifest: DAppManifest;
                      account: Account;
                      walletId: WalletId;
                  }
                | null
                | TonConnectError;
        }
    >(async ({ params, result }) => {
        if (!result || result instanceof TonConnectError) {
            await sendEventToBridge({
                response: connectErrorResponse(result ?? tonConnectUserRejectError()),
                sessionKeyPair: params.sessionKeyPair,
                clientSessionId: params.clientSessionId
            });
        } else {
            const response = await saveWalletTonConnect({
                storage: sdk.storage,
                account: result.account,
                walletId: result.walletId,
                manifest: result.manifest,
                params,
                replyItems: result.replyItems.items,
                appVersion: sdk.version
            });

            await sendEventToBridge({
                response,
                sessionKeyPair: params.sessionKeyPair,
                clientSessionId: params.clientSessionId
            });

            await client.invalidateQueries([QueryKey.tonConnectConnection]);

            if (sdk.notifications) {
                try {
                    const wallet = result.account.getTonWallet(result.walletId);
                    if (!wallet) {
                        throw new Error('Wallet not found');
                    }
                    const enable = await sdk.notifications.subscribed(wallet.rawAddress);
                    if (enable) {
                        await sdk.notifications.subscribeTonConnect(
                            params.clientSessionId,
                            new URL(params.request.manifestUrl).host
                        );
                    }
                } catch (e) {
                    if (e instanceof Error) sdk.topMessage(e.message);
                }
            }
        }
        await client.invalidateQueries([QueryKey.tonConnectLastEventId]);

        return undefined;
    });
};

export const useCompleteInjectedConnection = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<
        undefined,
        Error,
        {
            params: TonConnectInjectedConnectionParams;
            result:
                | {
                      replyItems: TonConnectEventPayload;
                      manifest: DAppManifest;
                      account: Account;
                      walletId: WalletId;
                  }
                | null
                | TonConnectError;
            sendBridgeResponse: (result: ConnectEvent) => void;
        }
    >(async ({ params, result, sendBridgeResponse }) => {
        if (!result || result instanceof TonConnectError) {
            sendBridgeResponse(connectErrorResponse(result ?? tonConnectUserRejectError()));
        } else {
            const response = await saveWalletTonConnect({
                storage: sdk.storage,
                account: result.account,
                walletId: result.walletId,
                manifest: result.manifest,
                params,
                replyItems: result.replyItems.items,
                appVersion: sdk.version
            });

            sendBridgeResponse(response);

            await client.invalidateQueries([QueryKey.tonConnectConnection]);
        }

        return undefined;
    });
};

export interface ResponseSendProps {
    connection: AccountConnectionHttp;
    response: WalletResponse<RpcMethod>;
}

export const useTonConnectHttpResponseMutation = () => {
    return useMutation<void, Error, ResponseSendProps>(async ({ connection, response }) => {
        return sendEventToBridge({
            response,
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId: connection.clientSessionId
        });
    });
};
