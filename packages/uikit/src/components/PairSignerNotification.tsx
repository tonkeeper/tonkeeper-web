import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { createTransferQr } from '@tonkeeper/core/dist/service/signerService';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useNavigate } from '../hooks/navigate';
import { useScanner } from '../hooks/scanner';
import { useTranslation } from '../hooks/translation';
import { Notification, NotificationBlock } from './Notification';
import { Button } from './fields/Button';
import { Background, HeaderBlock } from './home/AccountView';
import { AnimatedQrCode } from './home/qrCodeView';
import { isStandardTonWallet, TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';

export const SignerContent: FC<{
    sdk: IAppSdk;
    boc: string;
    onClose: () => void;
    onSubmit: (result: string) => void;
    wallet: TonWalletStandard;
}> = ({ sdk, boc, onClose, onSubmit, wallet }) => {
    const { t } = useTranslation();
    const { extension } = useAppContext();

    useNavigate(sdk, onClose);

    const openScanner = useScanner(null, onSubmit);

    const message = useMemo(() => {
        if (!isStandardTonWallet(wallet)) {
            throw new Error('Unexpected wallet');
        }
        return createTransferQr(wallet.publicKey, wallet.version, boc);
    }, [wallet, boc]);

    return (
        <NotificationBlock
            onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                openScanner();
            }}
        >
            <HeaderBlock title={t('import_signer')} description={t('signer_scan_tx_description')} />
            <Background extension={extension} margin>
                <AnimatedQrCode message={message} />
            </Background>
            <Button primary size="large" fullWidth type="submit">
                {t('signer_scan_result')}
            </Button>
        </NotificationBlock>
    );
};

const PairSignerNotification = () => {
    const sdk = useAppSdk();

    const [boc, setBoc] = useState<string | undefined>(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);
    const [wallet, setWallet] = useState<TonWalletStandard | undefined>(undefined);

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
            params: {
                boc: string;
                wallet: TonWalletStandard;
            };
        }) => {
            setBoc(options.params!.boc);
            setId(options.id);
            setWallet(options.params!.wallet);
        };
        sdk.uiEvents.on('signer', handler);
        return () => {
            sdk.uiEvents.off('signer', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!boc || !requestId || !wallet) return undefined;
        return (
            <SignerContent
                sdk={sdk}
                boc={boc}
                onClose={onCancel}
                onSubmit={onSubmit}
                wallet={wallet}
            />
        );
    }, [sdk, boc, requestId, onCancel, onSubmit, wallet]);

    return (
        <Notification isOpen={boc != null && requestId != null} handleClose={onCancel}>
            {Content}
        </Notification>
    );
};

export default PairSignerNotification;
