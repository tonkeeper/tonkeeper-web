import React, { FC, PropsWithChildren } from 'react';
import styled, { css } from 'styled-components';
import { ListItemPayload } from '../../components/List';
import { Body2, Label1 } from '../../components/Text';
import { ActivityIcon, ReceiveIcon } from '../../components/activity/ActivityIcons';
import { useTranslation } from '../../hooks/translation';
import { useAppSdk } from '../../hooks/appSdk';
import { toShortValue } from '@tonkeeper/core/dist/utils/common';

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

const AddressTextContent = styled(SecondaryText)`
    cursor: pointer;

    transition: opacity 0.15s ease-in-out;
    opacity: 1;

    &:hover {
        opacity: 0.7;
    }
`;

export type AddressTextValue = string | { type: 'name'; value: string };
export function toAddressTextValue(name: string | undefined, address: string): AddressTextValue {
    return name ? { type: 'name', value: name } : address;
}

export const AddressText: FC<{ children: AddressTextValue }> = ({ children }) => {
    const sdk = useAppSdk();
    const { t } = useTranslation();

    const childrenValue = typeof children === 'string' ? children : children.value;
    const displayChildren =
        typeof children === 'string' ? toShortValue(children, 8) : children.value;

    return (
        <AddressTextContent onClick={() => sdk.copyToClipboard(childrenValue, t('copied'))}>
            {displayChildren}
        </AddressTextContent>
    );
};

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
    address: AddressTextValue;
    date: string;
    amount?: React.ReactNode;
    green?: boolean;
    isScam?: boolean;
}> = ({ title, entry, address, date, amount, green, isScam }) => {
    return (
        <Description>
            <FirstLine>
                <FirstLabel>{title}</FirstLabel>
                <AmountText green={green} isScam={isScam}>
                    {amount}
                </AmountText>
                <AmountText green={green} isScam={isScam}>
                    {entry}
                </AmountText>
            </FirstLine>
            <SecondLine>
                <AddressText>{address}</AddressText>
                <SecondaryText>{date}</SecondaryText>
            </SecondLine>
        </Description>
    );
};
