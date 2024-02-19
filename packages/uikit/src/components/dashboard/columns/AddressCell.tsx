import { Body2 } from '../../Text';
import { FC } from 'react';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { Network } from '@tonkeeper/core/dist/entries/network';

export const AddressCell: FC<{ raw: string; network: Network }> = ({ raw, network }) => {
    const userFriendlyAddress = formatAddress(raw, network);
    return <Body2>{toShortValue(userFriendlyAddress)}</Body2>;
};
