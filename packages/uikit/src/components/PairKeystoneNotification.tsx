import { KeystoneTonSDK } from '@keystonehq/keystone-sdk/dist/chains/ton';
import type { UR } from '@keystonehq/keystone-sdk/dist/types/ur';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { KeystoneMessageType, KeystonePathInfo } from '@tonkeeper/core/dist/service/keystone/types';
import { constructKeystoneSignRequest } from '@tonkeeper/core/dist/service/keystone/ur';
import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../hooks/appContext';
import { useAppSdk } from '../hooks/appSdk';
import { useKeystoneScanner } from '../hooks/keystoneScanner';
import { useNavigate } from '../hooks/navigate';
import { useTranslation } from '../hooks/translation';
import { Notification, NotificationBlock } from './Notification';
import { Button } from './fields/Button';
import { Background, HeaderBlock } from './home/AccountView';
import { KeystoneAnimatedQRCode } from './home/qrCodeView';
import { useActiveWallet } from '../state/wallet';
import { formatAddress } from '@tonkeeper/core/dist/utils/common';

export const SignerContent: FC<{
    sdk: IAppSdk;
    transactionParams: {
        message: Buffer;
        messageType: KeystoneMessageType;
        pathInfo?: KeystonePathInfo;
    };
    onClose: () => void;
    handleResult: (result: string) => void;
}> = ({ sdk, transactionParams, onClose, handleResult }) => {
    const wallet = useActiveWallet();
    const { t } = useTranslation();
    const { extension } = useAppContext();

    useNavigate(sdk, onClose);

    const onSubmit = useCallback((ur: UR) => {
        const signature = new KeystoneTonSDK().parseSignature(ur);
        handleResult(signature.signature);
    }, []);

    const openScanner = useKeystoneScanner(null, onSubmit);

    const ur = useMemo(() => {
        return constructKeystoneSignRequest(
            transactionParams.message,
            transactionParams.messageType,
            formatAddress(wallet.rawAddress),
            transactionParams.pathInfo
        );
    }, [transactionParams]);

    return (
        <NotificationBlock
            onSubmit={e => {
                e.preventDefault();
                e.stopPropagation();
                openScanner();
            }}
        >
            <HeaderBlock
                title={t('keystone_sign_title')}
                description={t('keystone_sign_subtitle')}
            />
            <Background extension={extension} margin>
                <KeystoneAnimatedQRCode data={ur} />
            </Background>
            <Button primary size="large" fullWidth type="submit">
                {t('signer_scan_result')}
            </Button>
        </NotificationBlock>
    );
};

const PairKeystoneNotification = () => {
    const sdk = useAppSdk();

    const [transactionParams, setTransactionParams] = useState<
        | { message: Buffer; messageType: KeystoneMessageType; pathInfo?: KeystonePathInfo }
        | undefined
    >(undefined);
    const [requestId, setId] = useState<number | undefined>(undefined);

    const close = useCallback(() => {
        setTransactionParams(undefined);
        setId(undefined);
    }, []);

    const handleResult = useCallback(
        (result: string) => {
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
            method: 'keystone';
            id?: number | undefined;
            params: {
                message: Buffer;
                messageType: KeystoneMessageType;
                pathInfo?: KeystonePathInfo;
            };
        }) => {
            setTransactionParams(options.params!);
            setId(options.id);
        };
        sdk.uiEvents.on('keystone', handler);
        return () => {
            sdk.uiEvents.off('keystone', handler);
        };
    }, [sdk]);

    const Content = useCallback(() => {
        if (!transactionParams || !requestId) return undefined;
        return (
            <SignerContent
                sdk={sdk}
                transactionParams={transactionParams}
                onClose={onCancel}
                handleResult={handleResult}
            />
        );
    }, [sdk, transactionParams, requestId, onCancel, handleResult]);

    return (
        <Notification
            isOpen={transactionParams != null && requestId != null}
            handleClose={onCancel}
        >
            {Content}
        </Notification>
    );
};

export default PairKeystoneNotification;
