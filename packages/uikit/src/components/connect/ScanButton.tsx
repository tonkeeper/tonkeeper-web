import { ConnectItemReply, DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRequestNotificationAnalytics } from '../../hooks/amplitude';
import { useAppSdk } from '../../hooks/appSdk';
import { ScanIcon } from '../Icon';
import { TonConnectNotification } from './TonConnectNotification';
import { useResponseConnectionMutation, useGetConnectInfo } from './connectHook';

const ScanBlock = styled.div`
    position: absolute;
    right: 1rem;
    top: 1rem;

    color: ${props => props.theme.accentBlue};
`;

export const ScanButton = () => {
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

    const handlerClose = async (replyItems?: ConnectItemReply[], manifest?: DAppManifest) => {
        if (!params) return;
        responseReset();
        try {
            await responseConnectionAsync({ params, replyItems, manifest });
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

    return (
        <>
            <ScanBlock onClick={onClick}>
                <ScanIcon />
            </ScanBlock>
            <TonConnectNotification
                origin={undefined}
                params={params?.request ?? null}
                handleClose={handlerClose}
            />
        </>
    );
};
