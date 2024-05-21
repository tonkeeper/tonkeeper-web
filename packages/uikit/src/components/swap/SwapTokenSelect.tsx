import { FC } from 'react';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { styled } from 'styled-components';
import { Label2 } from '../Text';
import { SwitchIcon } from '../Icon';

const SelectContainer = styled.button`
    border: none;
    display: flex;
    align-items: center;
    background: none;
    padding: 0;
    cursor: pointer;
    gap: 6px;
    height: 36px;
    width: fit-content;
`;

const TokenSymbol = styled(Label2)`
    display: block;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
`;

const TokenImage = styled.img`
    height: 24px;
    width: 24px;
    flex-shrink: 0;
`;

export const SwapTokenSelect: FC<{
    token: TonAsset;
    onTokenChange: (token: TonAsset) => void;
    className?: string;
}> = ({ token, onTokenChange, className }) => {
    return (
        <SelectContainer className={className}>
            <TokenImage src={token.image} />
            <TokenSymbol>{token.symbol}</TokenSymbol>
            <SwitchIcon />
        </SelectContainer>
    );
};
