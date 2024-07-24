import { RecipientData, isTonRecipientData } from '@tonkeeper/core/dist/entries/send';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { getDecimalSeparator, getNotDecimalSeparator } from '@tonkeeper/core/dist/utils/formatting';
import { isNumeric, removeGroupSeparator, seeIfLargeTail } from '@tonkeeper/core/dist/utils/send';
import BigNumber from 'bignumber.js';
import { FC } from 'react';
import styled from 'styled-components';
import { useAppContext } from '../../../hooks/appContext';
import { formatter } from '../../../hooks/balance';
import { Body1, Body2, H3, Label2, Num2 } from '../../Text';
import { cropName } from '../ConfirmListItem';
import { AmountState } from './amountState';
import { useActiveTonNetwork } from '../../../state/wallet';

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
    border-radius: ${props =>
        props.theme.displayType === 'full-width'
            ? props.theme.corner2xSmall
            : props.theme.cornerMedium};
    background-color: ${props =>
        props.maxValue ? props.theme.buttonPrimaryBackground : props.theme.backgroundContent};
    transition: background-color 0.15s ease;
    color: ${props =>
        props.maxValue ? props.theme.buttonPrimaryForeground : props.theme.textPrimary};

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
    transform: translate(-50%, 38px);
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

    if ('dnsName' in address && typeof address.dnsName === 'string') {
        return <Name>{cropName(address.dnsName)}</Name>;
    }

    return <></>;
};

export const getRecipientAddress = (recipient: RecipientData, network: Network) => {
    if (isTonRecipientData(recipient)) {
        if ('dns' in recipient.address) {
            return formatAddress(recipient.toAccount.address, network);
        }
    }
    return recipient.address.address;
};

export const RecipientAddress: FC<{ recipient: RecipientData }> = ({ recipient }) => {
    const network = useActiveTonNetwork();
    const address = getRecipientAddress(recipient, network);
    return <Address>{toShortValue(address)}</Address>;
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
        const decimalSeparator = getDecimalSeparator();
        if (decimalSeparator) {
            const separators = value.matchAll(new RegExp(`\\${decimalSeparator}`, 'g'));
            if (separators && [...separators].length > 1) return false;
        }
        if (/^[a-zA-Z]+$/.test(value)) return false;
        if (!isNumeric(removeGroupSeparator(value))) return false;
        if (seeIfLargeTail(value, decimals)) return false;
    }

    return true;
};

export const inputToBigNumber = (value: string): BigNumber => {
    return new BigNumber(removeGroupSeparator(value).replace(',', '.') || '0');
};

export const SecondaryAmount: FC<{ amountState: AmountState; toggleFiat: () => void }> = ({
    amountState,
    toggleFiat
}) => {
    const { fiat } = useAppContext();

    const secondaryAmount: BigNumber | undefined = amountState.inFiat
        ? amountState.coinValue
        : amountState.fiatValue;

    if (!secondaryAmount) {
        return <></>;
    }

    return (
        <FiatBlock onClick={toggleFiat}>
            {formatter.format(secondaryAmount, {
                ignoreZeroTruncate: !amountState.inFiat,
                decimals: amountState.inFiat ? amountState.token.decimals : 2
            })}{' '}
            {amountState.inFiat ? amountState.token.symbol : fiat}
        </FiatBlock>
    );
};
