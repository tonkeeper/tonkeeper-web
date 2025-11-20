import {
    RpcMethod,
    RpcResponses,
    SIGN_DATA_ERROR_CODES,
    TonConnectAppRequestPayload,
    WalletResponse
} from '@tonkeeper/core/dist/entries/tonConnect';
import { FC } from 'react';
import { TonTransactionNotification } from './TonTransactionNotification';
import { SignDataNotification } from './SignDataNotification';
import {
    cancelSubscriptionV2ErrorResponse,
    cancelSubscriptionV2SuccessResponse,
    createSubscriptionV2ErrorResponse,
    createSubscriptionV2SuccessResponse,
    sendTransactionErrorResponse,
    sendTransactionSuccessResponse
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import {
    useTrackerTonConnectSendSuccess,
    useTrackTonConnectActionRequest
} from '../../hooks/analytics/events-hooks';
import { InstallSubscriptionV2Notification } from './InstallSubscriptionV2Notification';
import { RemoveSubscriptionV2Notification } from './RemoveSubscriptionV2Notification';

export const TonConnectRequestNotification: FC<{
    request: TonConnectAppRequestPayload | undefined;
    handleClose: (result: WalletResponse<RpcMethod>) => void;
    waitInvalidation?: boolean;
}> = ({ request, handleClose, waitInvalidation }) => {
    useTrackTonConnectActionRequest(request?.connection?.manifest.url);
    const trackSendSuccess = useTrackerTonConnectSendSuccess();

    return (
        <>
            <TonTransactionNotification
                params={request?.kind === 'sendTransaction' ? request.payload : null}
                handleClose={result => {
                    if (request) {
                        handleClose(
                            result
                                ? sendTransactionSuccessResponse(request.id, result.boc)
                                : sendTransactionErrorResponse(request.id)
                        );
                        if (result) {
                            trackSendSuccess({
                                dappUrl: request.connection.manifest.url,
                                sender: result.senderChoice
                            });
                        }
                    }
                }}
                waitInvalidation={waitInvalidation}
            />
            <SignDataNotification
                origin={
                    request?.connection.type === 'injected'
                        ? request?.connection.webViewOrigin
                        : request?.connection.manifest.url
                }
                params={request?.kind === 'signData' ? request.payload : null}
                handleClose={result => {
                    if (request) {
                        handleClose(
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
            <InstallSubscriptionV2Notification
                params={request?.kind === 'createSubscriptionV2' ? request.payload : null}
                handleClose={result => {
                    if (request) {
                        handleClose(
                            result
                                ? createSubscriptionV2SuccessResponse(request.id, result)
                                : createSubscriptionV2ErrorResponse(request.id)
                        );
                    }
                }}
            />
            <RemoveSubscriptionV2Notification
                params={request?.kind === 'cancelSubscriptionV2' ? request.payload : null}
                handleClose={boc => {
                    if (request) {
                        handleClose(
                            boc
                                ? cancelSubscriptionV2SuccessResponse(request.id, boc)
                                : cancelSubscriptionV2ErrorResponse(request.id)
                        );
                    }
                }}
            />
        </>
    );
};
