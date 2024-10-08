import { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { FullHeightBlock, Notification } from './Notification';
import { ScanQR } from './shared/ScanQR';

const Block = styled.div`
    margin: 0 -1rem;
    width: calc(100% + 2rem);
`;

const QrScanner = () => {
    const [scanId, setScanId] = useState<number | undefined>(undefined);
    const sdk = useAppSdk();
    const { standalone, ios } = useAppContext();
    const { t } = useTranslation();

    useEffect(() => {
        const handler = (options: { method: 'scan'; id?: number | undefined }) => {
            setScanId(options.id);
        };
        sdk.uiEvents.on('scan', handler);
        return () => {
            sdk.uiEvents.off('scan', handler);
        };
    }, []);

    const onCancel = () => {
        setScanId(undefined);
    };

    const onScan = useMemo(() => {
        return (data: string) => {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: scanId,
                params: data
            });
            setScanId(undefined);
        };
    }, [sdk, scanId, setScanId]);

    const isOpen = scanId !== undefined;

    const Content = useCallback(() => {
        return (
            <FullHeightBlock standalone={standalone}>
                <Block>
                    {isOpen && (
                        <ScanQR
                            onScan={onScan}
                            onError={e => {
                                sdk.uiEvents.emit('copy', {
                                    method: 'copy',
                                    id: scanId,
                                    params: e.message
                                });
                            }}
                        />
                    )}
                </Block>
            </FullHeightBlock>
        );
    }, [isOpen, onScan, standalone, ios]);

    return (
        <Notification isOpen={isOpen} handleClose={onCancel} title={t('scan_qr_title')}>
            {Content}
        </Notification>
    );
};

export default QrScanner;
