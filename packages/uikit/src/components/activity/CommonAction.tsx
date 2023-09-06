import React, { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { ListItemPayload } from '../../components/List';
import { Body2, Label1 } from '../../components/Text';
import { ActivityIcon, ReceiveIcon } from '../../components/activity/ActivityIcons';
import { useTranslation } from '../../hooks/translation';

export const ListItemGrid = styled(ListItemPayload)`
    display: grid;
    grid-template-columns: min-content 1fr;
    column-gap: 1rem;
    row-gap: 0.5rem;

    align-items: flex-start;
`;

export const Description = styled.div`
    flex-grow: 1;

    display: flex;
    flex-direction: column;

    white-space: nowrap;
`;

export const FirstLine = styled.div`
    display: grid;
    grid-template-columns: min-content auto min-content;
    gap: 0.25rem;
    width: 100%;
`;

export const AmountText = styled(Label1)<{ green?: boolean; isScam?: boolean }>`
    text-overflow: ellipsis;
    overflow: hidden;
    text-align: right;

    ${props =>
        props.isScam
            ? css`
                  color: ${props.theme.textTertiary};
              `
            : props.green
            ? css`
                  color: ${props.theme.accentGreen};
              `
            : undefined}
`;

export const SecondLine = styled.div`
    display: grid;
    grid-template-columns: auto min-content;
    gap: 0.25rem;
    width: 100%;

    > * {
        text-overflow: ellipsis;
        overflow: hidden;
    }
`;

export const FirstLabel = styled(Label1)`
    user-select: none;
`;

export const SecondaryText = styled(Body2)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const CommentMessage = styled(Body2)`
    padding: 0.5rem 0.75rem;
    background: ${props => props.theme.backgroundContentTint};
    border-radius: 18px;
    line-break: anywhere;
    display: inline-flex;
`;

const Wrapper = styled.div`
    grid-column: 2 / 3;
`;

export const Comment: FC<{ comment?: string }> = ({ comment }) => {
    if (!comment) return <></>;
    return (
        <Wrapper>
            <CommentMessage>{comment}</CommentMessage>
        </Wrapper>
    );
};

export const ErrorAction: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useTranslation();
    return (
        <ListItemGrid>
            <ActivityIcon>
                <ReceiveIcon />
            </ActivityIcon>
            <FirstLabel>{children ?? t('Error')}</FirstLabel>
        </ListItemGrid>
    );
};

export const ColumnLayout: FC<{
    title: string;
    entry: string;
    address: string;
    date: string;
    amount?: React.ReactNode;
    green?: boolean;
}> = ({ title, entry, address, date, amount, green }) => {
    return (
        <Description>
            <FirstLine>
                <FirstLabel>{title}</FirstLabel>
                <AmountText green={green}>{amount}</AmountText>
                <AmountText green={green}>{entry}</AmountText>
            </FirstLine>
            <SecondLine>
                <SecondaryText>{address}</SecondaryText>
                <SecondaryText>{date}</SecondaryText>
            </SecondLine>
        </Description>
    );
};
