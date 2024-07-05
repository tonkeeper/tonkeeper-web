import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { useRate } from '../../state/rates';
import {
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Skeleton } from '../shared/Skeleton';
import { Body3 } from '../Text';
import { styled } from 'styled-components';
import { formatFiatCurrency } from '../../hooks/balance';
import { useAppContext } from '../../hooks/appContext';

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
    cursor: default;
`;

export const SwapAmountFiat: FC<{
    amount: BigNumber | undefined;
    asset: Pick<TonAsset, 'address'>;
}> = ({ amount, asset }) => {
    const { fiat } = useAppContext();
    const { data: rate, isLoading } = useRate(tonAssetAddressToString(asset.address));
    if (!amount) {
        return <div />;
    }

    if (!isLoading && !rate?.prices) {
        return <div />;
    }

    if (isLoading) {
        return <Skeleton width="80px" height="12px" margin="2px 0" />;
    }

    const inFiat = formatFiatCurrency(fiat, new BigNumber(rate.prices).multipliedBy(amount));

    return <Body3Styled>≈&nbsp;{inFiat}</Body3Styled>;
};
