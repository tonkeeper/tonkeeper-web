import { styled } from 'styled-components';
import { FC, Fragment } from 'react';
import { Body2, Body3, Label2 } from '../../Text';
import { WalletSwapAsset } from '../../../state/swap/useSwapAssets';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useAppContext } from '../../../hooks/appContext';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';

const SwapTokensListWrapper = styled.div`
    height: 500px;
    overflow-y: auto;
    width: calc(100% + 2rem);
    margin: 0 -1rem;

    &::-webkit-scrollbar {
        display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
`;

const TokensNotFoundContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.theme.textSecondary};
`;

export const SwapTokensList: FC<{
    walletSwapAssets: WalletSwapAsset[];
    onSelect: (asset: TonAsset) => void;
}> = ({ walletSwapAssets, onSelect }) => {
    return (
        <SwapTokensListWrapper>
            {walletSwapAssets.length ? (
                walletSwapAssets.map(swapAsset => (
                    <Fragment key={swapAsset.assetAmount.asset.id}>
                        <TokenListItem
                            onClick={() => onSelect(swapAsset.assetAmount.asset)}
                            swapAsset={swapAsset}
                        />
                        <Divider />
                    </Fragment>
                ))
            ) : (
                <TokensNotFoundContainer>
                    <Body2>Tokens not found</Body2>
                </TokensNotFoundContainer>
            )}
        </SwapTokensListWrapper>
    );
};

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const TokenListItemWrapper = styled.button`
    border: none;
    width: 100%;
    padding: 8px 1rem;
    display: flex;
    gap: 12px;
    background-color: transparent;

    transition: background-color 0.15s ease-in-out;
    cursor: pointer;

    &:hover,
    &:focus {
        background-color: ${p => p.theme.backgroundContent};
    }
`;

const TokenImage = styled.img`
    height: 40px;
    width: 40px;
    border-radius: 100%;
`;

const TokenInfo = styled.div`
    display: flex;
    flex-direction: column;
    width: calc(100% - 52px);
`;

const TokenInfoLine = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;

    > *:first-child {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    > *:nth-child(2) {
        margin-left: auto;
    }
`;

const TokenInfoSecondLine = styled(TokenInfoLine)`
    color: ${p => p.theme.textSecondary};
`;

const BalanceLabel = styled(Label2)<{ isZero: boolean }>`
    color: ${p => (p.isZero ? p.theme.textTertiary : p.theme.textPrimary)};
`;

const TokenListItem: FC<{ swapAsset: WalletSwapAsset; onClick?: () => void }> = ({
    swapAsset,
    onClick
}) => {
    const isZeroBalance = swapAsset.assetAmount.relativeAmount.isZero();
    const { fiat } = useAppContext();
    return (
        <TokenListItemWrapper onClick={onClick}>
            <TokenImage src={swapAsset.assetAmount.asset.image} />
            <TokenInfo>
                <TokenInfoLine>
                    <Label2>{swapAsset.assetAmount.asset.symbol}</Label2>
                    <BalanceLabel isZero={isZeroBalance}>
                        {swapAsset.assetAmount.stringRelativeAmount}
                    </BalanceLabel>
                </TokenInfoLine>
                <TokenInfoSecondLine>
                    <Body3>{swapAsset.assetAmount.asset.name}</Body3>
                    {!isZeroBalance && (
                        <Body3>{formatFiatCurrency(fiat, swapAsset.fiatAmount)}</Body3>
                    )}
                </TokenInfoSecondLine>
            </TokenInfo>
        </TokenListItemWrapper>
    );
};
