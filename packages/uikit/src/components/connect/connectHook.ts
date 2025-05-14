import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
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
    connectRejectResponse,
    parseTonConnect,
    saveWalletTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    AccountConnection,
    TonConnectParams
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

    return useMutation<null | TonConnectParams, Error, string>(async url => {
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

            // TODO: handle auto connect

            showLoadingToast();

            return params;
        } catch (e) {
            if (!options?.hideErrorToast) {
                notifyError(String(e));
            }
            throw e;
        }
    });
};

export interface AppConnectionProps {
    params: TonConnectParams;
    result: {
        replyItems: TonConnectEventPayload;
        manifest: DAppManifest;
        account: Account;
        walletId: WalletId;
    } | null;
}

export const useResponseConnectionMutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<undefined, Error, AppConnectionProps>(async ({ params, result }) => {
        if (result) {
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
            await client.invalidateQueries([QueryKey.tonConnectLastEventId]);
        } else {
            await sendEventToBridge({
                response: connectRejectResponse(),
                sessionKeyPair: params.sessionKeyPair,
                clientSessionId: params.clientSessionId
            });
        }

        return undefined;
    });
};

export interface ResponseSendProps {
    connection: AccountConnection;
    response: WalletResponse<RpcMethod>;
}

export const useTonConnectResponseMutation = () => {
    return useMutation<void, Error, ResponseSendProps>(async ({ connection, response }) => {
        return sendEventToBridge({
            response,
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId: connection.clientSessionId
        });
    });
};
