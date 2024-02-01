import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { QRCode } from 'react-qrcode-logo';
import { useAppContext, useWalletContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useNavigate } from '../hooks/navigate';
import { useScanner } from '../hooks/scanner';
import { useTranslation } from '../hooks/translation';
import { Notification, NotificationBlock } from './Notification';
import { Button } from './fields/Button';
import { AddressText, Background, HeaderBlock, QrWrapper } from './home/AccountView';

export const SignerContent: FC<{
    sdk: IAppSdk;
    boc: string;
    onClose: () => void;
    onSubmit: (result: string) => void;
}> = ({ sdk, boc, onClose, onSubmit }) => {
    const wallet = useWalletContext();
    const { t } = useTranslation();
    const { extension } = useAppContext();

    useNavigate(sdk, onClose);

    const openScanner = useScanner(null, onSubmit);

    const message = useMemo(() => {
        return `tonsign://?pk=${Buffer.from(wallet.publicKey, 'hex').toString(
            'base64'
        )}&body=${boc}`;
    }, [wallet, boc]);

    return (
        <NotificationBlock
            onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                openScanner();
            }}
        >
            <HeaderBlock description={t('signer_scan_tx_description')} />
            <Background extension={extension}>
                <QrWrapper>
                    <QRCode
                        size={400}
                        value={message}
                        qrStyle="dots"
                        eyeRadius={{
                            inner: 2,
                            outer: 16
                        }}
                    />
                </QrWrapper>
                <AddressText extension={extension}>{message}</AddressText>
            </Background>
            <Button primary size="large" type="submit">
                {t('signer_scan_result')}
            </Button>
        </NotificationBlock>
    );
};

const PairSignerNotification = () => {
    const sdk = useAppSdk();

    const { t } = useTranslation();

    const [boc, setBoc] = useState<string | undefined>(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const close = useCallback(() => {
        setBoc(undefined);
        setId(undefined);
    }, []);

    const onSubmit = useCallback(
        (result: string) => {
            console.log(result);

            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: result
            });
            close();
        },
        [sdk, requestId, close]
    );

    const onCancel = useCallback(() => {
        if (requestId) {
            sdk.uiEvents.emit('response', {
                method: 'response',
                id: requestId,
                params: new Error('Cancel auth request')
            });
        }
        close();
    }, [requestId, sdk, close]);

    useEffect(() => {
        const handler = (options: {
            method: 'signer';
            id?: number | undefined;
            params: string;
        }) => {
            setBoc(options.params!);
            setId(options.id);
        };
        sdk.uiEvents.on('signer', handler);
        return () => {
            sdk.uiEvents.off('signer', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!boc || !requestId) return undefined;
        return <SignerContent sdk={sdk} boc={boc} onClose={onCancel} onSubmit={onSubmit} />;
    }, [sdk, boc, requestId, onCancel, onSubmit]);

    return (
        <Notification
            isOpen={boc != null && requestId != null}
            hideButton
            handleClose={onCancel}
            title={t('txActions_signRaw_title')}
        >
            {Content}
        </Notification>
    );
};

export default PairSignerNotification;
