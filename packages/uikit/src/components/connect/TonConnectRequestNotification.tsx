import {
    RpcMethod,
    RpcResponses,
    SIGN_DATA_ERROR_CODES,
    TonConnectAppRequestPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import { FC, useCallback } from 'react';
import { TonTransactionNotification } from './TonTransactionNotification';
import { SignDataNotification } from './SignDataNotification';
import {
    sendTransactionErrorResponse,
    sendTransactionSuccessResponse
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { useTonConnectResponseMutation } from './connectHook';
import { AccountConnection } from '@tonkeeper/core/dist/service/tonConnect/connectionService';

export const TonConnectRequestNotification: FC<{
    request: TonConnectAppRequestPayload | undefined;
    handleClose: () => void;
    waitInvalidation?: boolean;
}> = ({ request, handleClose, waitInvalidation }) => {
    const { mutateAsync: responseAsync } = useTonConnectResponseMutation();
    const onClose = useCallback(
        async (connection: AccountConnection, response: WalletResponse<RpcMethod>) => {
            try {
                await responseAsync({ connection, response });
            } finally {
                handleClose();
            }
        },
        [responseAsync, handleClose]
    );

    return (
        <>
            <TonTransactionNotification
                params={request?.kind === 'sendTransaction' ? request.payload : null}
                handleClose={boc => {
                    if (request) {
                        onClose(
                            request.connection,
                            boc
                                ? sendTransactionSuccessResponse(request.id, boc)
                                : sendTransactionErrorResponse(request.id)
                        );
                    }
                }}
                waitInvalidation={waitInvalidation}
            />
            <SignDataNotification
                origin={request?.connection.webViewUrl ?? request?.connection.manifest.url}
                params={request?.kind === 'signData' ? request.payload : null}
                handleClose={result => {
                    if (request) {
                        onClose(
                            request.connection,
                            result
                                ? ({
                                      id: request.id,
                                      result: result
                                  } as RpcResponses['signData']['success'])
                                : ({
                                      id: request.id,
                                      error: {
                                          code: SIGN_DATA_ERROR_CODES.USER_REJECTS_ERROR,
                                          message: 'Reject Request'
                                      }
                                  } as RpcResponses['signData']['error'])
                        );
                    }
                }}
            />
        </>
    );
};
