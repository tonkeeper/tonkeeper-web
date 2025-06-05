import {
    ConnectEvent,
    ConnectRequest,
    DAppManifest,
    TonConnectEventPayload
} from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import {
    useResponseHttpConnectionMutation,
    useProcessOpenedLink,
    useResponseInjectedConnectionMutation
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
    subscribeToSignerResponse,
    subscribeToSignerUrlOpened,
    subscribeToTonOrTonConnectUrlOpened,
    tonConnectSSE
} from '../../libs/ton-connect/http-connector';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useParseAndAddSigner } from '@tonkeeper/uikit/dist/state/wallet';
import { useRenameNotification } from '@tonkeeper/uikit/dist/components/modals/RenameNotificationControlled';
import { closeNotification } from '@tonkeeper/uikit/dist/components/Notification';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import {
    RedirectToTonkeeperMobile,
    tonkeeperMobileTonConnectDeeplinkScheme,
    tonkeeperMobileTonDeeplinkScheme
} from './RedirectToTonkeeperMobile';
import { useTonTransactionNotification } from '@tonkeeper/uikit/dist/components/modals/TonTransactionNotificationControlled';
import { errorMessage } from '@tonkeeper/core/dist/utils/types';
import { useToast } from '@tonkeeper/uikit/dist/hooks/useNotification';
import { tonConnectTonkeeperProAppName } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { tonConnectInjectedConnector } from '../../libs/ton-connect/injected-connector';
import { CapacitorDappBrowser } from '../../libs/plugins/dapp-browser-plugin';
import { useValueRef } from '@tonkeeper/uikit/dist/libs/common';

export const useMobileProPairSignerSubscription = () => {
    const { mutateAsync } = useParseAndAddSigner();
    const { onOpen } = useRenameNotification();
    useEffect(() => {
        return subscribeToSignerUrlOpened(link => {
            mutateAsync({ link, source: 'deeplink' }).then(acc => {
                closeNotification('add-wallet-signer');
                onOpen({ accountId: acc.id });
            });
        });
    }, []);
};

const useInjectedBridgeConnectionSubscription = (
    setParams: (params: TonConnectConnectionParams) => void
) => {
    const ref = useRef<{
        resolve: (value: ConnectEvent) => void;
        reject: (reason?: unknown) => void;
    } | null>(null);
    useEffect(() => {
        tonConnectInjectedConnector.setConnectHandler(
            (request: ConnectRequest, webViewOrigin: string) => {
                return new Promise<ConnectEvent>(async (resolve, reject) => {
                    if (ref.current) {
                        ref.current.reject('Request Cancelled');
                    }
                    ref.current = { resolve, reject };

                    await CapacitorDappBrowser.setIsMainViewInFocus(true);
                    setParams({
                        type: 'injected',
                        protocolVersion: 2,
                        request,
                        appName: tonConnectTonkeeperProAppName,
                        webViewOrigin
                    });
                });
            }
        );
    }, []);

    return ref;
};

export const DeepLinkSubscription = () => {
    useMobileProPairSignerSubscription();

    const sdk = useAppSdk();
    useEffect(() => {
        return subscribeToSignerResponse(val => {
            sdk.uiEvents.emit('signerTxResponse', { method: 'signerTxResponse', params: val });
        });
    }, []);

    const [params, setParams] = useState<TonConnectConnectionParams | null>(null);
    const paramsRef = useValueRef(params);

    const onNewParamsReceived = useCallback((p: TonConnectConnectionParams | null) => {
        if (p && paramsRef.current) {
            throw new Error('New params received while old params not processed');
        }

        setParams(p);
    }, []);

    const injectedBridgeConnectionRef =
        useInjectedBridgeConnectionSubscription(onNewParamsReceived);
    const [tkMobileUrl, setTkMobileUrl] = useState<{
        url: string;
        unsupportedLinkError?: string;
    } | null>(null);

    const { mutateAsync, reset } = useProcessOpenedLink({
        hideLoadingToast: true,
        hideErrorToast: true
    });
    const { onClose: closeTonTransaction } = useTonTransactionNotification();

    const { mutateAsync: responseHttpConnectionAsync, reset: responseReset } =
        useResponseHttpConnectionMutation();
    const { mutateAsync: responseInjectedConnectionAsync, reset: injectedResponseReset } =
        useResponseInjectedConnectionMutation();

    const handlerClose = async (
        result: {
            replyItems: TonConnectEventPayload;
            manifest: DAppManifest;
            account: Account;
            walletId: WalletId;
        } | null
    ) => {
        setTkMobileUrl(null);
        if (!params) return;

        responseReset();
        injectedResponseReset();
        if (params.type === 'injected') {
            try {
                if (!injectedBridgeConnectionRef.current?.resolve) {
                    throw new Error('Injected bridge not found');
                }
                await responseInjectedConnectionAsync({
                    params,
                    result,
                    sendBridgeResponse: injectedBridgeConnectionRef.current.resolve
                });
            } finally {
                setParams(null);
                await CapacitorDappBrowser.setIsMainViewInFocus(false);
            }
        } else {
            try {
                await responseHttpConnectionAsync({ params, result });
            } finally {
                setParams(null);
                await tonConnectSSE.reconnect();
            }
        }
    };

    const notifyError = useToast();

    useEffect(() => {
        return subscribeToTonOrTonConnectUrlOpened(async (url: string) => {
            reset();

            let unsupportedLinkError = undefined;
            try {
                onNewParamsReceived(await mutateAsync(url));
            } catch (e) {
                unsupportedLinkError = errorMessage(e);
            }

            const modifiedUrl = modifyLinkScheme(url);
            if (modifiedUrl) {
                setTkMobileUrl({ url: modifiedUrl, unsupportedLinkError });
                setTimeout(() => setTkMobileUrl(null), 5000);
            } else if (unsupportedLinkError) {
                notifyError(unsupportedLinkError);
            }
        });
    }, []);

    return (
        <>
            <TonConnectNotification
                origin={params?.type === 'injected' ? params.webViewOrigin : undefined}
                params={params ?? null}
                handleClose={handlerClose}
            />
            <RedirectToTonkeeperMobile
                isOpen={!!tkMobileUrl}
                unsupportedLinkError={tkMobileUrl?.unsupportedLinkError}
                onClick={confirmed => {
                    setTkMobileUrl(null);
                    if (tkMobileUrl && confirmed) {
                        setParams(null);
                        closeTonTransaction();
                        sdk.openPage(tkMobileUrl.url);
                    }
                }}
            />
        </>
    );
};

const modifyLinkScheme = (link: string) => {
    try {
        const [protocol, body] = link.split('://');
        switch (protocol) {
            case 'tonkeeper':
            case 'ton':
                return `${tonkeeperMobileTonDeeplinkScheme}://${body}`;
            case 'tonkeeper-tc':
            case 'tc':
                return `${tonkeeperMobileTonConnectDeeplinkScheme}://${body}`;
            case 'https':
            case 'http': {
                const u = new URL(link);
                if (u.pathname.startsWith('/ton-connect')) {
                    return `${tonkeeperMobileTonConnectDeeplinkScheme}://${
                        link.split('ton-connect')[1]
                    }`;
                } else {
                    return `${tonkeeperMobileTonDeeplinkScheme}://${u.pathname.slice(1)}${
                        u.search
                    }`;
                }
                return '';
            }
            default:
                return null;
        }
    } catch (e) {
        console.error(e);
        return null;
    }
};
