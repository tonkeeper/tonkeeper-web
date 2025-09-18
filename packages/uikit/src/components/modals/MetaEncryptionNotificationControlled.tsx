import { useEffect, useId } from 'react';
import { styled } from 'styled-components';
import { subscriptionFormTempAuth$ } from '@tonkeeper/core/dist/ProAuthTokenService';

import { createModalControl } from './createModalControl';
import {
    Notification,
    NotificationBlock,
    NotificationFooter,
    NotificationFooterPortal
} from '../Notification';
import { ErrorBoundary } from '../shared/ErrorBoundary';
import { fallbackRenderOver } from '../Error';
import { Button } from '../fields/Button';
import { Body2, Label2 } from '../Text';
import { useTranslation } from '../../hooks/translation';
import { handleSubmit } from '../../libs/form';
import { useMutateMetaKeyAndCertificates } from '../../state/wallet';
import { useAtomValue } from '../../libs/useAtom';
import { useNotifyError, useToast } from '../../hooks/useNotification';

interface IAtomParams {
    onConfirm?: (success?: boolean) => void;
}
const { hook, paramsControl } = createModalControl<IAtomParams>();

export const useMetaEncryptionNotification = hook;

export const MetaEncryptionNotificationControlled = () => {
    const { isOpen, onClose } = useMetaEncryptionNotification();
    const params = useAtomValue(paramsControl);
    const { onConfirm } = params ?? {};

    const onCancel = () => {
        onClose();
        onConfirm?.(false);
    };

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onCancel}>
            {() => (
                <ErrorBoundary
                    fallbackRender={fallbackRenderOver('Failed to display Encryption Key modal')}
                >
                    <MetaEncryptionNotificationContent onConfirm={onConfirm} onClose={onCancel} />
                </ErrorBoundary>
            )}
        </NotificationStyled>
    );
};

interface IMetaEncryptionProps {
    onClose: () => void;
    onConfirm?: (success?: boolean) => void;
}

const MetaEncryptionNotificationContent = ({ onClose, onConfirm }: IMetaEncryptionProps) => {
    const formId = useId();
    const { t } = useTranslation();

    const toast = useToast();
    const targetAuth = useAtomValue(subscriptionFormTempAuth$);

    const {
        isError,
        isLoading,
        isSuccess,
        mutateAsync: createMetaEncryption
    } = useMutateMetaKeyAndCertificates();
    useNotifyError(isError && new Error(t('meta_encrypt_key_creation_failed')));

    const onSubmit = async () => {
        const wallet = targetAuth?.wallet;

        if (!wallet || !onConfirm) {
            toast(t('meta_encrypt_key_creation_failed'));

            return;
        }

        await createMetaEncryption({ wallet });
    };

    useEffect(() => {
        if (!isSuccess || !onConfirm) return;

        onConfirm(true);
    }, [isSuccess, onConfirm]);

    useEffect(() => {
        if (!isError || !onConfirm) return;

        onConfirm(false);
    }, [isError, onConfirm]);

    return (
        <ContentWrapper onSubmit={handleSubmit(onSubmit)} id={formId}>
            <Label2>{t('create_encryption_key')}</Label2>
            <Body2Styled>{t('create_encryption_key_description')}</Body2Styled>

            <NotificationFooterPortal>
                <NotificationFooter>
                    <Button primary fullWidth type="submit" form={formId} loading={isLoading}>
                        <Label2>{t('create')}</Label2>
                    </Button>

                    <Button secondary fullWidth type="button" onClick={onClose}>
                        <Label2>{t('cancel')}</Label2>
                    </Button>
                </NotificationFooter>
            </NotificationFooterPortal>
        </ContentWrapper>
    );
};

const NotificationStyled = styled(Notification)`
    max-width: 650px;
`;

const ContentWrapper = styled(NotificationBlock)`
    padding: 1rem 0 2rem;
`;

const Body2Styled = styled(Body2)`
    max-width: 350px;
    text-align: center;
    color: ${props => props.theme.textSecondary};
`;
