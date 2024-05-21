import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Skeleton } from '../shared/Skeleton';
import { Body3, Label3 } from '../Text';
import { styled } from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import { useAssetWeiBalance } from '../../state/home';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';

const Body3Styled = styled(Body3)`
    color: ${p => p.theme.textSecondary};
`;

const BalanceContainer = styled.div`
    display: flex;
    height: 16px;
    align-items: center;
`;

const MaxButton = styled.button`
    border: none;
    background: none;
    color: ${p => p.theme.accentBlue};
    height: fit-content;
    margin-left: 0.5rem;

    > * {
        display: block;
        height: fit-content;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

export const SwapAmountBalance: FC<{
    onMax?: (value: BigNumber) => void;
    asset: Pick<TonAsset, 'address' | 'decimals'>;
}> = ({ onMax, asset }) => {
    const balance = useAssetWeiBalance({ address: asset.address, blockchain: BLOCKCHAIN_NAME.TON });
    const format = useFormatCoinValue();

    return (
        <BalanceContainer>
            <Body3Styled>Balance:&nbsp;</Body3Styled>
            {balance ? (
                <Body3Styled>{format(balance, asset.decimals)}</Body3Styled>
            ) : (
                <Skeleton width="80px" height="12px" margin="2px 0" />
            )}
            {onMax && (
                <MaxButton
                    disabled={!balance || balance.isZero()}
                    onClick={() => onMax(shiftedDecimals(balance!, asset.decimals))}
                >
                    <Label3>Max</Label3>
                </MaxButton>
            )}
        </BalanceContainer>
    );
};
