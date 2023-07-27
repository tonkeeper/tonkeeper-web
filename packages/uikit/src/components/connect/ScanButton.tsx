import { useMutation } from '@tanstack/react-query';
import { ConnectRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import { parseTonConnect } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
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

    return useMutation<null | ConnectRequest, Error, string>(async url => {
        const params = parseTonConnect({ url });

        if (params === null) {
            sdk.uiEvents.emit('copy', {
                method: 'copy',
                id: Date.now(),
                params: t('Unexpected_QR_Code')
            });
            return null;
        }

        sdk.uiEvents.emit('copy', {
            method: 'copy',
            id: Date.now(),
            params: t('loading')
        });

        return params.request;
    });
};

export const ScanButton = () => {
    const sdk = useAppSdk();
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const [params, setParams] = useState<ConnectRequest | null>(null);

    const { mutateAsync, reset } = useGetConnectInfo();

    const onScan = useCallback(
        async (link: string) => {
            setParams(await mutateAsync(link));
        },
        [setParams, mutateAsync]
    );

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

    return (
        <>
            <ScanBlock onClick={onClick}>
                <ScanIcon></ScanIcon>
            </ScanBlock>
            <TonConnectNotification
                origin={undefined}
                params={params}
                handleClose={() => setParams(null)}
            />
        </>
    );
};
