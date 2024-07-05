import { FC, useCallback } from 'react';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { styled } from 'styled-components';
import { Label2 } from '../Text';
import { SwitchIcon } from '../Icon';
import { useOpenSwapTokensList } from './tokens-list/SwapTokensListNotification';

const TokenSymbol = styled(Label2)`
    display: block;
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 0;
    color: ${p => p.theme.textPrimary};

    transition: color 0.15s ease-in-out;
`;

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

    &:hover {
        > ${TokenSymbol} {
            color: ${p => p.theme.textSecondary};
        }
    }
`;

const TokenImage = styled.img`
    height: 24px;
    width: 24px;
    border-radius: 100%;
    flex-shrink: 0;
`;

export const SwapTokenSelect: FC<{
    token: TonAsset;
    onTokenChange: (token: TonAsset) => void;
    className?: string;
}> = ({ token, onTokenChange, className }) => {
    const onClose = useCallback(
        (t: TonAsset | undefined) => t && onTokenChange(t),
        [onTokenChange]
    );

    const openList = useOpenSwapTokensList(onClose);

    return (
        <SelectContainer className={className} onClick={openList}>
            <TokenImage src={token.image} />
            <TokenSymbol>{token.symbol}</TokenSymbol>
            <SwitchIcon />
        </SelectContainer>
    );
};
