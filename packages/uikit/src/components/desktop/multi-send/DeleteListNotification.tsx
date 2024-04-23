import styled from 'styled-components';
import { Body2, Label1 } from '../../Text';
import { Notification } from '../../Notification';
import React, { FC } from 'react';
import { Button } from '../../fields/Button';

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
    return (
        <Notification isOpen={isOpen} handleClose={onCancel}>
            {() => (
                <NotificationBodyStyled>
                    <Label1>Delete &apos;{listName}&apos;?</Label1>
                    <Body2Secondary>
                        This action is irreversible, and all data will be lost.
                    </Body2Secondary>
                    <ButtonsContainer>
                        <Button secondary onClick={onCancel}>
                            Cancel
                        </Button>
                        <Button primary onClick={onDelete}>
                            Delete
                        </Button>
                    </ButtonsContainer>
                </NotificationBodyStyled>
            )}
        </Notification>
    );
};
