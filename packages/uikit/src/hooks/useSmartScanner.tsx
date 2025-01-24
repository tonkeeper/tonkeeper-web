import { useAppSdk } from './appSdk';
import React, { useCallback, useEffect, useState } from 'react';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import {
    useGetConnectInfo,
    useResponseConnectionMutation
} from '../components/connect/connectHook';
import { ConnectItemReply, DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import { Account } from '@tonkeeper/core/dist/entries/account';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useRequestNotificationAnalytics } from './amplitude';
import { TonConnectNotification } from '../components/connect/TonConnectNotification';

export const useSmartScanner = () => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const [params, setParams] = useState<TonConnectParams | null>(null);

    const { mutateAsync, reset } = useGetConnectInfo();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        useResponseConnectionMutation();

    const onScan = useCallback(
        async (link: string) => {
            setParams(await mutateAsync(link));
        },
        [setParams, mutateAsync]
    );

    const handlerClose = async (
        result: {
            replyItems: ConnectItemReply[];
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

    useRequestNotificationAnalytics(params?.request?.manifestUrl);

    return {
        onScan: onClick,
        NotificationComponent: (
            <TonConnectNotification
                origin={undefined}
                params={params?.request ?? null}
                handleClose={handlerClose}
            />
        )
    };
};
