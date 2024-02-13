import styled from 'styled-components';
import { Body2 } from '../../Text';
import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { useFormatCoinValue } from '../../../hooks/balance';

const BalanceTONThStyled = styled.th`
    color: ${props => props.theme.textSecondary};
    min-width: 124px;
`;

const BalanceTONTdStyled = styled.td`
    color: ${props => props.theme.textSecondary};
    min-width: 124px;
`;

export const BalanceTONTh = () => {
    return (
        <BalanceTONThStyled>
            <Body2>Balance TON</Body2>
        </BalanceTONThStyled>
    );
};

export const BalanceTONTd: FC<{ balance: BigNumber }> = ({ balance }) => {
    const format = useFormatCoinValue();

    const formatted = format(balance);

    return (
        <BalanceTONTdStyled>
            <Body2>{formatted}&nbsp;TON</Body2>
        </BalanceTONTdStyled>
    );
};
