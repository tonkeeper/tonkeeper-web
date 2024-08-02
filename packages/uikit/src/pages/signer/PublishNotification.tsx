import { useQuery } from '@tanstack/react-query';
import { publishSignerMessage } from '@tonkeeper/core/dist/service/signerService';
import { FC, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckmarkCircleIcon, ExclamationMarkCircleIcon } from '../../components/Icon';
import { FullHeightBlockResponsive, Notification } from '../../components/Notification';
import { Label2 } from '../../components/Text';
import { ButtonBlock, ConfirmMainButton, ResultButton } from '../../components/transfer/common';
import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { AppRoute } from '../../libs/routes';
import { useActiveStandardTonWallet } from '../../state/wallet';

const usePublishMessage = (signatureHex: string) => {
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const wallet = useActiveStandardTonWallet();
    return useQuery([signatureHex], async () => {
        return publishSignerMessage(sdk, api, wallet, signatureHex);
    });
};

const Confirm: FC<{ signatureHex: string; onClose: () => void }> = ({ signatureHex, onClose }) => {
    const { t } = useTranslation();
    const { isFetched, isError } = usePublishMessage(signatureHex);
    const navigate = useNavigate();

    useEffect(() => {
        if (isError || isFetched) {
            setTimeout(() => {
                onClose();
                navigate(AppRoute.activity);
            }, 2000);
        }
    }, [isError, isFetched]);

    return (
        <FullHeightBlockResponsive standalone={false} fitContent={true}>
            <ButtonBlock>
                {isFetched && !isError && (
                    <ResultButton done>
                        <CheckmarkCircleIcon />
                        <Label2>{t('send_screen_steps_done_done_label')}</Label2>
                    </ResultButton>
                )}
                {isFetched && isError && (
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
    const { t } = useTranslation();
    const [searchParams, setParams] = useSearchParams();

    const signatureHex = searchParams.get('sign');

    const onClose = useCallback(() => {
        searchParams.delete('sign');
        setParams(searchParams);
    }, [searchParams, setParams]);

    const Content = useCallback(() => {
        if (!signatureHex) return <></>;
        return <Confirm signatureHex={signatureHex} onClose={onClose} />;
    }, [signatureHex, onClose]);

    return (
        <Notification
            isOpen={signatureHex != null}
            handleClose={onClose}
            title={t('publish_message')}
        >
            {Content}
        </Notification>
    );
};

export default SignerPublishNotification;
