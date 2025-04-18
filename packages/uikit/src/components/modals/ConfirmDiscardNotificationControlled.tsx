import { Notification, NotificationFooter, NotificationFooterPortal } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useAtom } from '../../libs/useAtom';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../Text';
import { ButtonResponsiveSize } from '../fields/Button';
import { useTranslation } from '../../hooks/translation';

const { hook, paramsControl } = createModalControl<{
    onClose(isDiscarded: boolean): void;
}>();

export const useConfirmDiscardNotification = hook;

const ContentContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;

    > ${Label2} {
        margin-bottom: 4px;
    }

    > ${Body2} {
        color: ${p => p.theme.textSecondary};
        margin-bottom: 24px;
    }
`;

const ButtonsContainer = styled.div`
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const NotificationStyled = styled(Notification)`
    ${p =>
        p.theme.displayType === 'full-width' &&
        css`
            .dialog-header {
                padding-bottom: 0;
            }
        `}
`;

export const ConfirmDiscardNotificationControlled = () => {
    const { t } = useTranslation();
    const { isOpen, onClose } = useConfirmDiscardNotification();
    const [params] = useAtom(paramsControl);

    const onContinue = useCallback(() => {
        onClose();
        params?.onClose(false);
    }, [onClose, params?.onClose]);

    const onDiscard = useCallback(() => {
        onClose();
        params?.onClose(true);
    }, [onClose, params?.onClose]);

    return (
        <NotificationStyled isOpen={isOpen} handleClose={onContinue}>
            {() => (
                <ContentContainer>
                    <Label2>{t('confirm_discard_title')}</Label2>
                    <Body2>{t('confirm_discard_description')}</Body2>
                    <NotificationFooterPortal>
                        <NotificationFooter>
                            <ButtonsContainer>
                                <ButtonResponsiveSize primary onClick={onContinue}>
                                    {t('confirm_discard_btn_continue_editing')}
                                </ButtonResponsiveSize>
                                <ButtonResponsiveSize onClick={onDiscard}>
                                    {t('confirm_discard_btn_discard')}
                                </ButtonResponsiveSize>
                            </ButtonsContainer>
                        </NotificationFooter>
                    </NotificationFooterPortal>
                </ContentContainer>
            )}
        </NotificationStyled>
    );
};
