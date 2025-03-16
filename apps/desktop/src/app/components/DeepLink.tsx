import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import {
    useResponseConnectionMutation,
    useGetConnectInfo
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useEffect, useState } from 'react';
import { sendBackground } from '../../libs/backgroudService';
import { TonConnectMessage } from '../../libs/message';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';

export const DeepLinkSubscription = () => {
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
            sendBackground({ king: 'reconnect' } as TonConnectMessage);
        }
    };

    useEffect(() => {
        window.backgroundApi.onTonConnect(async (url: string) => {
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
