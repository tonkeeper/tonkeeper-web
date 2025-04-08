import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
    DAppManifest,
    RpcMethod,
    SendTransactionAppRequest,
    TonConnectEventPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import {
    parseTonTransferWithAddress,
    parseTronTransferWithAddress,
    seeIfBringToFrontLink
} from '@tonkeeper/core/dist/service/deeplinkingService';
import {
    connectRejectResponse,
    parseTonConnect,
    saveWalletTonConnect,
    sendTransactionErrorResponse,
    sendTransactionSuccessResponse
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

export const useGetConnectInfo = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const notifyError = useToast();

    return useMutation<null | TonConnectParams, Error, string>(async url => {
        try {
            const bring = seeIfBringToFrontLink({ url });
            if (bring != null) {
                // TODO: save ret parameter and user after confirm transaction
                return null;
            }

            const tonTransfer = parseTonTransferWithAddress({ url });
            if (tonTransfer) {
                sdk.uiEvents.emit('copy', {
                    method: 'copy',
                    id: Date.now(),
                    params: t('loading')
                });

                sdk.uiEvents.emit('transfer', {
                    method: 'transfer',
                    id: Date.now(),
                    params: { chain: BLOCKCHAIN_NAME.TON, ...tonTransfer, from: 'qr-code' }
                });
                return null;
            }

            const tronTransfer = parseTronTransferWithAddress({ url });
            if (tronTransfer) {
                sdk.uiEvents.emit('copy', {
                    method: 'copy',
                    id: Date.now(),
                    params: t('loading')
                });

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

            sdk.uiEvents.emit('copy', {
                method: 'copy',
                id: Date.now(),
                params: t('loading')
            });

            return params;
        } catch (e) {
            notifyError(String(e));
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
        return await sendEventToBridge({
            response,
            sessionKeyPair: connection.sessionKeyPair,
            clientSessionId: connection.clientSessionId
        });
    });
};
