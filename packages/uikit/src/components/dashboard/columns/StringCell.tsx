import { Body2 } from '../../Text';
import { FC } from 'react';

export const StringCell: FC<{ value: string }> = ({ value }) => {
    return <Body2>{value}</Body2>;
};
