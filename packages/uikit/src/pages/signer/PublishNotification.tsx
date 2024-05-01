import { useQuery } from '@tanstack/react-query';
import { publishSignerMessage } from '@tonkeeper/core/dist/service/signerService';
import { FC, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../../components/Icon';
import { FullHeightBlockResponsive, Notification } from '../../components/Notification';
import { Label2 } from '../../components/Text';
import { ButtonBlock, ConfirmMainButton, ResultButton } from '../../components/transfer/common';
import { useAppContext, useWalletContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';

const usePublishMessage = (signatureBase64: string) => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useWalletContext();
    return useQuery([signatureBase64], async () => {
        return await publishSignerMessage(sdk, api, wallet, signatureBase64);
    });
};

const Confirm: FC<{ signatureBase64: string; onClose: () => void }> = ({
    signatureBase64,
    onClose
}) => {
    const { t } = useTranslation();
    const { isFetched, isError } = usePublishMessage(signatureBase64);

    useEffect(() => {
        if (isError || isFetched) {
            setTimeout(onClose, 2000);
        }
    }, [isError, isFetched]);

    return (
        <FullHeightBlockResponsive standalone={false} fitContent={true}>
            <ButtonBlock>
                {isFetched && (
                    <ResultButton done>
                        <CheckmarkCircleIcon />
                        <Label2>{t('send_screen_steps_done_done_label')}</Label2>
                    </ResultButton>
                )}
                {isError && (
                    <ResultButton>
                        <ExclamationMarkCircleIcon />
                        <Label2>{t('send_publish_tx_error')}</Label2>
                    </ResultButton>
                )}
                {!isFetched && !isError && (
                    <ConfirmMainButton
                        isLoading={true}
                        isDisabled={true}
                        onClick={() => Promise.resolve(false)}
                        onClose={onClose}
                    />
                )}
            </ButtonBlock>
        </FullHeightBlockResponsive>
    );
};

const SignerPublishNotification = () => {
    let [searchParams, setParams] = useSearchParams();

    const signatureBase64 = searchParams.get('boc');

    const onClose = useCallback(() => {
        searchParams.delete('boc');
        setParams(searchParams);
    }, [searchParams, setParams]);

    const Content = useCallback(() => {
        if (!signatureBase64) return <></>;
        return <Confirm signatureBase64={signatureBase64} onClose={onClose} />;
    }, [signatureBase64, onClose]);

    return (
        <Notification
            isOpen={signatureBase64 != null}
            handleClose={onClose}
            title="Publish Message to Internet"
        >
            {Content}
        </Notification>
    );
};

export default SignerPublishNotification;
