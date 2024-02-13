import styled from 'styled-components';
import { Body2 } from '../../Text';
import { FC } from 'react';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Network } from '@tonkeeper/core/dist/entries/network';

const AddressThStyled = styled.th`
    color: ${props => props.theme.textSecondary};
    min-width: 102px;
`;

const AddressTdStyled = styled.td`
    min-width: 102px;
`;

export const AddressTh = () => {
    return (
        <AddressThStyled>
            <Body2>Address</Body2>
        </AddressThStyled>
    );
};


export const AddressTd: FC<{ addressRaw: string; network: Network }> = ({
    addressRaw,
    network
}) => {
    const userFriendlyAddress = formatAddress(addressRaw, network);
    return (
        <AddressTdStyled>
            <Body2>{toShortValue(userFriendlyAddress)}</Body2>
        </AddressTdStyled>
    );
};
