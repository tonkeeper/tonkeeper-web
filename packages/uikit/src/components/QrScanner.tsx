import { QrScanSignature } from '@polkadot/react-qr/ScanSignature';
import { useCallback, useEffect, useMemo, useState } from 'react';
import styled, { css } from 'styled-components';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useTranslation } from '../hooks/translation';
import { FullHeightBlock, Notification } from './Notification';

const Block = styled.div<{ ios: boolean }>`
    margin: 0 -1rem;
    width: calc(100% + 2rem);

    .ui--qr-Scan section > div {
        box-shadow: rgba(0, 0, 0, 0.5) 0px 0px 0px 5px inset !important;
    }

    ${props =>
        props.ios &&
        css`
            .ui--qr-Scan {
                transform: none !important;
            }
        `}
`;

const orderAnimatedQr = (values: string[]) => {
    for (let i = 0; i < 1000; i++) {
        const first = values.shift()!;
        values.push(first);
        if (first.length < 256) {
            return values.join('');
        }
    }

    return values.join('');
};

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
        const result: string[] = [];
        let timer: NodeJS.Timeout;

        const done = () => {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: scanId,
                params: orderAnimatedQr(result)
            });
            setScanId(undefined);
        };
        return ({ signature }: { signature: string }) => {
            clearTimeout(timer);

            signature = signature.slice(2);

            console.log(signature);

            if (!result.includes(signature)) {
                result.push(signature);
            }
            timer = setTimeout(done, 500);
        };
    }, [sdk, scanId, setScanId]);

    const Content = useCallback(() => {
        return (
            <FullHeightBlock standalone={standalone}>
                <Block ios={window.innerWidth <= 440}>
                    <QrScanSignature
                        onScan={onScan}
                        onError={e => {
                            sdk.uiEvents.emit('copy', {
                                method: 'copy',
                                id: scanId,
                                params: e.message
                            });
                        }}
                    />
                </Block>
            </FullHeightBlock>
        );
    }, [onScan, standalone, ios]);

    return (
        <Notification
            isOpen={scanId !== undefined}
            handleClose={onCancel}
            hideButton
            title={t('scan_qr_title')}
        >
            {Content}
        </Notification>
    );
};

export default QrScanner;
