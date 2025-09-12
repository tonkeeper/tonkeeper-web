import { useAppSdk } from './appSdk';
import React, { useCallback, useEffect, useState } from 'react';
import { TonConnectHttpConnectionParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { useProcessOpenedLink, useCompleteHttpConnection } from '../components/connect/connectHook';
import { DAppManifest, TonConnectEventPayload } from '@tonkeeper/core/dist/entries/tonConnect';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { TonConnectNotification } from '../components/connect/TonConnectNotification';
import { useTrackTonConnectConnectionRequest } from './analytics/events-hooks';
import { TonConnectError } from '@tonkeeper/core/dist/entries/exception';

export const useSmartScanner = () => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const [params, setParams] = useState<TonConnectHttpConnectionParams | null>(null);

    const { mutateAsync, reset } = useProcessOpenedLink();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        useCompleteHttpConnection();

    const onScan = useCallback(
        async (link: string) => {
            setParams(await mutateAsync(link));
        },
        [setParams, mutateAsync]
    );

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
        }
    };

    const onClick: React.MouseEventHandler<HTMLDivElement> = e => {
        e.stopPropagation();
        e.preventDefault();
        const id = Date.now();
        sdk.uiEvents.emit('scan', {
            method: 'scan',
            id: id,
            params: undefined
        });
        setScanId(id);
        reset();
    };

    useEffect(() => {
        const handler = (options: {
            method: 'response';
            id?: number | undefined;
            params: string;
        }) => {
            if (options.id === scanId) {
                onScan(options.params);
            }
        };
        sdk.uiEvents.on('response', handler);

        return () => {
            sdk.uiEvents.off('response', handler);
        };
    }, [sdk, scanId, onScan]);

    useTrackTonConnectConnectionRequest(params?.request?.manifestUrl);

    return {
        onScan: onClick,
        NotificationComponent: (
            <TonConnectNotification
                origin={undefined}
                params={params ?? null}
                handleClose={handlerClose}
            />
        )
    };
};
