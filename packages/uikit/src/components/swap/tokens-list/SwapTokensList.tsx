import { styled } from 'styled-components';
import { FC } from 'react';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { Body3, Label2 } from '../../Text';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';

const SwapTokensListWrapper = styled.div`
    height: calc(100% - 53px);
    overflow-y: auto;
    width: calc(100% + 2rem);
    margin: 0 -1rem;

    &::-webkit-scrollbar {
        display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
`;

export const SwapTokensList: FC<{ assets: AssetAmount<TonAsset>[] }> = ({ assets }) => {
    return (
        <SwapTokensListWrapper>
            {assets.map(token => (
                <>
                    <TokenListItem token={token} key={token.asset.id} />
                    <Divider />
                </>
            ))}
        </SwapTokensListWrapper>
    );
};

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const TokenListItemWrapper = styled.div`
    padding: 8px 1rem;
    display: flex;
    gap: 12px;
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

const TokenListItem: FC<{ token: AssetAmount<TonAsset> }> = ({ token }) => {
    const isZeroBalance = token.relativeAmount.isZero();
    return (
        <TokenListItemWrapper>
            <TokenImage src={token.asset.image} />
            <TokenInfo>
                <TokenInfoLine>
                    <Label2>{token.asset.symbol}</Label2>
                    <BalanceLabel isZero={isZeroBalance}>{token.stringRelativeAmount}</BalanceLabel>
                </TokenInfoLine>
                <TokenInfoSecondLine>
                    <Body3>{token.asset.name}</Body3>
                    {!isZeroBalance && <Body3>$1,344.17</Body3>}
                </TokenInfoSecondLine>
            </TokenInfo>
        </TokenListItemWrapper>
    );
};
