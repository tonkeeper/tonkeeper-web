import { Notification } from '../Notification';
import { createModalControl } from './createModalControl';
import React, { useCallback } from 'react';
import { useAtom } from '../../libs/atom';
import styled, { css } from 'styled-components';
import { Body2, Label2 } from '../Text';
import { Button } from '../fields/Button';

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
                    <Label2>Are you sure you want to leave?</Label2>
                    <Body2>
                        You have unsaved changes. If you close this window, your progress will be
                        lost. Do you want to continue?
                    </Body2>
                    <ButtonsContainer>
                        <Button primary onClick={onContinue}>
                            Continue Editing
                        </Button>
                        <Button onClick={onDiscard}>Discard Changes</Button>
                    </ButtonsContainer>
                </ContentContainer>
            )}
        </NotificationStyled>
    );
};
