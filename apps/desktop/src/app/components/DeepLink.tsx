import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import {
    useCompleteHttpConnection,
    useProcessOpenedLink
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useEffect, useState } from 'react';
import { sendBackground } from '../../libs/backgroudService';
import { TonConnectMessage } from '../../libs/message';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';

export const DeepLinkSubscription = () => {
    const [params, setParams] = useState<TonConnectHttpConnectionParams | null>(null);

    const { mutateAsync, reset } = useProcessOpenedLink();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        useCompleteHttpConnection();

    const handlerClose = async (
        result:
            | {
                  replyItems: TonConnectEventPayload;
                  manifest: DAppManifest;
                  account: Account;
                  walletId: WalletId;
              }
            | null
            | TonConnectError
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
            params={params ?? null}
            handleClose={handlerClose}
        />
    );
};
