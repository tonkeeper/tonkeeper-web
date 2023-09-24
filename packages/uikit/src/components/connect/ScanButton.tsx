import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConnectItemReply, DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import { parseTonTransfer } from '@tonkeeper/core/dist/service/deeplinkingService';
import {
    connectRejectResponse,
    parseTonConnect,
    saveWalletTonConnect
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { sendEventToBridge } from '@tonkeeper/core/dist/service/tonConnect/httpBridge';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useRequestNotificationAnalytics } from '../../hooks/amplitude';
import { useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { QueryKey } from '../../libs/queryKey';
import { ScanIcon } from '../Icon';
import { TonConnectNotification } from './TonConnectNotification';

const ScanBlock = styled.div`
    position: absolute;
    right: 1rem;
    top: 1rem;

    color: ${props => props.theme.accentBlue};
`;

const useGetConnectInfo = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return useMutation<null | TonConnectParams, Error, string>(async url => {
        const transfer = parseTonTransfer({ url });

        if (transfer) {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                id: Date.now(),
                params: t('loading')
            });

            sdk.uiEvents.emit('transfer', {
                method: 'transfer',
                id: Date.now(),
                params: { transfer }
            });
            return null;
        }

        const params = parseTonConnect({ url });

        if (params === null) {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                id: Date.now(),
                params: t('Unexpected_QR_Code')
            });
            return null;
        }

        // TODO: handle auto connect

        sdk.uiEvents.emit('copy', {
            method: 'copy',
            id: Date.now(),
            params: t('loading')
        });

        return params;
    });
};

interface AppConnectionProps {
    params: TonConnectParams;
    replyItems?: ConnectItemReply[];
    manifest?: DAppManifest;
}

const responseConnectionMutation = () => {
    const sdk = useAppSdk();
    const wallet = useWalletContext();
    const client = useQueryClient();

    return useMutation<undefined, Error, AppConnectionProps>(
        async ({ params, replyItems, manifest }) => {
            if (replyItems && manifest) {
                const response = await saveWalletTonConnect({
                    storage: sdk.storage,
                    wallet,
                    manifest,
                    params,
                    replyItems,
                    appVersion: sdk.version
                });

                await sendEventToBridge({
                    response,
                    sessionKeyPair: params.sessionKeyPair,
                    clientSessionId: params.clientSessionId
                });

                await client.invalidateQueries([wallet.publicKey, QueryKey.connection]);
            } else {
                await sendEventToBridge({
                    response: connectRejectResponse(),
                    sessionKeyPair: params.sessionKeyPair,
                    clientSessionId: params.clientSessionId
                });
            }

            return undefined;
        }
    );
};

export const ScanButton = () => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const [params, setParams] = useState<TonConnectParams | null>(null);

    const { mutateAsync, reset } = useGetConnectInfo();
    const { mutateAsync: responseConnectionAsync, reset: responseReset } =
        responseConnectionMutation();

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
