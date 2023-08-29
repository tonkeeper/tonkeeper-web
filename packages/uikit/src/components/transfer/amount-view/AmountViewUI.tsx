import { RecipientData, isTonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { getDecimalSeparator, getNotDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { isNumeric, removeGroupSeparator, seeIfLargeTail } from '@tonkeeper/core/dist/utils/send';
import BigNumber from 'bignumber.js';
import React, { FC } from 'react';
import styled from 'styled-components';
import { Body1, Body2, H3, Label2, Num2 } from '../../Text';
import { cropName } from '../ConfirmListItem';

export const Center = styled.div`
    text-align: center;
    margin-bottom: -8px;
`;

export const SubTitle = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

export const Title = styled(H3)`
    margin: -6px 0 0;
`;

export const AmountBlock = styled.label`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 256px;
    padding: 1rem;
    box-sizing: border-box;
    position: relative;
    width: 100%;
    border-radius: ${props => props.theme.cornerSmall};
    background: ${props => props.theme.backgroundContent};
`;

export const MaxRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;

    user-select: none;
`;

export const MaxButton = styled(Label2)<{ maxValue: boolean }>`
    cursor: pointer;
    padding: 8px 16px;
    border-radius: ${props => props.theme.cornerMedium};
    background-color: ${props =>
        props.maxValue ? props.theme.buttonPrimaryBackground : props.theme.backgroundContent};
    transition: background-color 0.1s ease;

    &:hover {
        background-color: ${props =>
            props.maxValue
                ? props.theme.buttonPrimaryBackgroundHighlighted
                : props.theme.backgroundContentTint};
    }
`;

export const Remaining = styled(Body2)`
    color: ${props => props.theme.textSecondary};
`;

export const RemainingInvalid = styled(Body2)`
    color: ${props => props.theme.accentRed};
`;

export const Symbol = styled(Num2)`
    color: ${props => props.theme.textSecondary};
    padding-left: 12px;
    white-space: pre;
    padding-bottom: 3px;

    @media (max-width: 600px) {
        padding-left: 8px;
    }
`;

export const SelectCenter = styled.div`
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 3;
`;

export const FiatBlock = styled(Body1)`
    cursor: pointer;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, 54px);
    z-index: 2;

    padding: 8px 16px;

    color: ${props => props.theme.textSecondary};
    border: 1px solid ${props => props.theme.buttonTertiaryBackground};
    border-radius: ${props => props.theme.cornerLarge};

    max-width: 80%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: pre;

    user-select: none;
`;

export const InputBlock = styled.div`
    display: flex;
    align-items: flex-end;
`;

export const Name = styled.span`
    color: ${props => props.theme.textPrimary};
    margin-left: 4px;
`;

export const Address = styled.span`
    margin-left: 4px;
`;

export const AssetBadge = styled.div`
    padding: 0.5rem 0.75rem;
    border-radius: ${props => props.theme.cornerExtraSmall};
    background-color: ${props => props.theme.buttonTertiaryBackground};
`;

export const RecipientName: FC<{ recipient: RecipientData }> = ({ recipient }) => {
    const { address } = recipient;

    if ('isFavorite' in address && address.isFavorite) {
        return <Name>{cropName(address.name)}</Name>;
    }

    if (!isTonRecipientData(recipient)) {
        return null;
    }

    if (recipient.toAccount.name) {
        return <Name>{cropName(recipient.toAccount.name)}</Name>;
    }

    if ('dns' in address && address.dns.names === null) {
        return <Name>{cropName(address.address)}</Name>;
    }

    return <></>;
};

export const replaceTypedDecimalSeparator = (value: string): string => {
    if (value.endsWith(getNotDecimalSeparator())) {
        const updated = value.slice(0, -1) + getDecimalSeparator();
        if (isNumeric(removeGroupSeparator(updated))) return updated;
    }
    return value;
};

export const seeIfValueValid = (value: string, decimals: number) => {
    if (value.length > 21) return false;
    if (value !== '') {
        if (value.endsWith('e')) return false;
        const separators = value.match(getDecimalSeparator());
        if (separators && separators.length > 1) return false;
        if (/^[a-zA-Z]+$/.test(value)) return false;
        if (!isNumeric(removeGroupSeparator(value))) return false;
        if (seeIfLargeTail(value, decimals)) return false;
    }

    return true;
};

export const inputToBigNumber = (value: string): BigNumber => {
    return new BigNumber(removeGroupSeparator(value).replace(',', '.') || '0');
};
