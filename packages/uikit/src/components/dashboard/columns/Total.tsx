import styled from 'styled-components';
import { Body2 } from '../../Text';
import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { formatFiatCurrency } from '../../../hooks/balance';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';

const TotalThStyled = styled.th`
    color: ${props => props.theme.textSecondary};
    min-width: 116px;
`;

const TotalTdStyled = styled.td`
    min-width: 116px;
`;

export const TotalTh = () => {
    return (
        <TotalThStyled>
            <Body2>Total</Body2>
        </TotalThStyled>
    );
};

export const TotalTd: FC<{ balance: BigNumber }> = ({ balance }) => {
    // TODO convert to user currency
    const formatted = formatFiatCurrency(FiatCurrencies.USD, balance);

    return (
        <TotalTdStyled>
            <Body2>{formatted}</Body2>
        </TotalTdStyled>
    );
};
