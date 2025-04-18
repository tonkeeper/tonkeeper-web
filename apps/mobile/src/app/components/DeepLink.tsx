import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import {
    useResponseConnectionMutation,
    useGetConnectInfo
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useEffect, useState } from 'react';
import {
    subscribeToSignerResponse,
    subscribeToSignerUrlOpened,
    subscribeToTonOrTonConnectUrlOpened,
    tonConnectSSE
} from '../../libs/tonConnect';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useParseAndAddSigner } from '@tonkeeper/uikit/dist/state/wallet';
import { useRenameNotification } from '@tonkeeper/uikit/dist/components/modals/RenameNotificationControlled';
import { closeNotification } from '@tonkeeper/uikit/dist/components/Notification';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';

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

export const DeepLinkSubscription = () => {
    useMobileProPairSignerSubscription();

    const sdk = useAppSdk();
    useEffect(() => {
        return subscribeToSignerResponse(val => {
            sdk.uiEvents.emit('signerTxResponse', { method: 'signerTxResponse', params: val });
        });
    }, []);

    const [params, setParams] = useState<TonConnectParams | null>(null);

    const { mutateAsync, reset } = useGetConnectInfo();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        useResponseConnectionMutation();

    const handlerClose = async (
        result: {
            replyItems: TonConnectEventPayload;
            manifest: DAppManifest;
            account: Account;
            walletId: WalletId;
        } | null
    ) => {
        if (!params) return;
        responseReset();
        try {
            await responseConnectionAsync({ params, result });
        } finally {
            setParams(null);
            await tonConnectSSE.reconnect();
        }
    };

    useEffect(() => {
        return subscribeToTonOrTonConnectUrlOpened(async (url: string) => {
            reset();
            setParams(await mutateAsync(url));
        });
    }, []);

    return (
        <TonConnectNotification
            origin={undefined}
            params={params?.request ?? null}
            handleClose={handlerClose}
        />
    );
};
