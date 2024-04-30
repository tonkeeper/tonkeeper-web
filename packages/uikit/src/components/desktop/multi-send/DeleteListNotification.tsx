import styled from 'styled-components';
import { Body2, Label1 } from '../../Text';
import { Notification } from '../../Notification';
import React, { FC } from 'react';
import { Button } from '../../fields/Button';
import { useTranslation } from '../../../hooks/translation';

const NotificationBodyStyled = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 1rem 1rem;
`;

const Body2Secondary = styled(Body2)`
    color: ${props => props.theme.textTertiary};
    margin-top: 4px;
    margin-bottom: 24px;
    max-width: 304px;
    text-align: center;
`;

const ButtonsContainer = styled.div`
    display: flex;
    margin-top: 2rem;
    gap: 0.5rem;
    width: 100%;

    > * {
        flex: 1;
    }
`;

export const DeleteListNotification: FC<{
    isOpen: boolean;
    onCancel: () => void;
    onDelete: () => void;
    listName: string;
}> = ({ isOpen, onCancel, onDelete, listName }) => {
    const { t } = useTranslation();
    return (
        <Notification isOpen={isOpen} handleClose={onCancel}>
            {() => (
                <NotificationBodyStyled>
                    <Label1>
                        {t('delete')}&apos;{listName}&apos;?
                    </Label1>
                    <Body2Secondary>{t('multi_send_delete_description')}</Body2Secondary>
                    <ButtonsContainer>
                        <Button secondary onClick={onCancel}>
                            {t('cancel')}
                        </Button>
                        <Button primary onClick={onDelete}>
                            {t('delete')}
                        </Button>
                    </ButtonsContainer>
                </NotificationBodyStyled>
            )}
        </Notification>
    );
};
