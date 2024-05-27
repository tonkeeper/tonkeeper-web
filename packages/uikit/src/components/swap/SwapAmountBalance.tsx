import { FC } from 'react';
import BigNumber from 'bignumber.js';
import { Skeleton } from '../shared/Skeleton';
import { Body3, Label3 } from '../Text';
import { styled } from 'styled-components';
import { useFormatCoinValue } from '../../hooks/balance';
import { shiftedDecimals } from '@tonkeeper/core/dist/utils/balance';
import {
    useMaxSwapValue,
    useSwapFromAmount,
    useSwapFromAsset,
    useSwapToAsset
} from '../../state/swap/useSwapForm';
import { useAssetWeiBalance } from '../../state/home';
import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { useTranslation } from '../../hooks/translation';

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

export const SwapFromAmountBalance: FC = () => {
    const [_, setSwapAmount] = useSwapFromAmount();
    const [asset] = useSwapFromAsset();
    const { data: balance } = useMaxSwapValue();

    return (
        <SwapAmountContent
            balance={balance}
            decimals={asset.decimals}
            onMax={() => setSwapAmount(shiftedDecimals(balance!, asset.decimals))}
        />
    );
};

export const SwapToAmountBalance: FC = () => {
    const [asset] = useSwapToAsset();
    const balance = useAssetWeiBalance({ address: asset.address, blockchain: BLOCKCHAIN_NAME.TON });

    return <SwapAmountContent balance={balance} decimals={asset.decimals} />;
};

const SwapAmountContent: FC<{
    balance: BigNumber | undefined;
    decimals: number;
    onMax?: () => void;
}> = ({ balance, decimals = 0, onMax }) => {
    const { t } = useTranslation();
    const format = useFormatCoinValue();

    return (
        <BalanceContainer>
            <Body3Styled>{t('swap_balance')}:&nbsp;</Body3Styled>
            {balance ? (
                <Body3Styled>{format(balance, decimals)}</Body3Styled>
            ) : (
                <Skeleton width="80px" height="12px" margin="2px 0" />
            )}
            {onMax && (
                <MaxButton disabled={!balance || balance.isZero()} onClick={onMax}>
                    <Label3>{t('swap_max')}</Label3>
                </MaxButton>
            )}
        </BalanceContainer>
    );
};
