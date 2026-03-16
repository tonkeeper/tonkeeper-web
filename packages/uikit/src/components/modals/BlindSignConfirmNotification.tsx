import { FC } from 'react';
import { styled } from 'styled-components';
import { useTranslation } from '../../hooks/translation';
import { Notification, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { Button } from '../fields/Button';
import { Body2 } from '../Text';

const ButtonsBlock = styled.div`
    display: flex;
    gap: 8px;

    > * {
        flex: 1;
    }
`;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 0 16px;

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        margin-bottom: 24px;
    }
`;

export const BlindSignConfirmNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading?: boolean;
}> = ({ isOpen, onClose, onConfirm, isLoading }) => {
    const { t } = useTranslation();

    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={t('blind_sign_confirm_title')}>
            {() => (
                <ContentContainer>
                    <Body2>{t('blind_sign_confirm_message')}</Body2>
                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonsBlock>
                                <Button secondary loading={isLoading} onClick={onClose}>
                                    {t('cancel')}
                                </Button>
                                <Button primary loading={isLoading} onClick={onConfirm}>
                                    {t('blind_sign_confirm_button')}
                                </Button>
                            </ButtonsBlock>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </ContentContainer>
            )}
        </Notification>
    );
};

export const BlindSignEnableNotification: FC<{
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}> = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useTranslation();

    return (
        <Notification isOpen={isOpen} handleClose={onClose} title={t('blind_sign_warning_title')}>
            {() => (
                <ContentContainer>
                    <Body2>{t('blind_sign_warning_message')}</Body2>
                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonsBlock>
                                <Button secondary onClick={onClose}>
                                    {t('cancel')}
                                </Button>
                                <Button primary onClick={onConfirm}>
                                    {t('blind_sign_enable_confirm')}
                                </Button>
                            </ButtonsBlock>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </ContentContainer>
            )}
        </Notification>
    );
};
