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
    gap: 0.5rem 1rem;
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
    grid-template-columns: minmax(5ch, 1fr) max-content minmax(0, max-content);
    gap: 0.25rem;
    width: 100%;

    /* Token symbol (3rd column) wraps instead of forcing its full width and truncating the amount,
       so the amount stays fully visible and a long ticker like "GRAM (ex TON)" breaks across lines. */
    > *:nth-child(3) {
        white-space: normal;
        overflow-wrap: normal;
        overflow: visible;
        text-overflow: clip;
    }
`;

export const AmountText = styled(Label1)<{ green?: boolean; isScam?: boolean }>`
    white-space: nowrap;
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
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const SecondaryText = styled(Body2)`
    color: ${props => props.theme.textSecondary};
    user-select: none;
`;

const AddressTextContent = styled(SecondaryText)`
    cursor: pointer;
    width: fit-content;
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

    const handleClick = (e: React.MouseEvent<HTMLSpanElement>) => {
        e.stopPropagation();
        sdk.copyToClipboard(childrenValue, t('copied'));
    };
    return <AddressTextContent onClick={handleClick}>{displayChildren}</AddressTextContent>;
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
