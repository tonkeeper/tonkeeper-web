import { Notification } from '../../Notification';
import { FC, useCallback } from 'react';
import { atom, useAtom } from '../../../libs/atom';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { styled } from 'styled-components';
import { SwapSearchInput } from './SwapSearchInput';
import { SwapTokensList } from './SwapTokensList';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import BigNumber from 'bignumber.js';

const swapTokensListOpened$ = atom<{ onClose: (token: TonAsset | undefined) => void } | undefined>(
    undefined
);
export const useOpenSwapTokensList = (onClose: (token: TonAsset | undefined) => void) => {
    const [_, setIsOpen] = useAtom(swapTokensListOpened$);

    return useCallback(
        () =>
            setIsOpen(() => ({
                onClose
            })),
        [setIsOpen, onClose]
    );
};

export const SwapTokensListNotification: FC = () => {
    const [onSelect, setIsOpen] = useAtom(swapTokensListOpened$);

    return (
        <Notification
            isOpen={!!onSelect}
            handleClose={() => {
                onSelect?.onClose(undefined);
                setIsOpen(undefined);
            }}
            title="Tokens"
        >
            {() => <SwapTokensListContent onSelect={onSelect?.onClose || (() => {})} />}
        </Notification>
    );
};

const SwapSearchInputStyled = styled(SwapSearchInput)`
    margin-bottom: 1rem;
`;

const SwapTokensListContentWrapper = styled.div`
    height: calc(100% - 80px);
`;

const Divider = styled.div`
    width: calc(100% + 2rem);
    margin: 0 -1rem;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const mockAsset = new AssetAmount({ asset: TON_ASSET, weiAmount: new BigNumber(10000000000) });

const SwapTokensListContent: FC<{ onSelect: (token: TonAsset | undefined) => void }> = ({
    onSelect
}) => {
    return (
        <SwapTokensListContentWrapper>
            <SwapSearchInputStyled />
            <Divider />
            <SwapTokensList
                assets={[
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    mockAsset,
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) }),
                    new AssetAmount<TonAsset>({ asset: TON_ASSET, weiAmount: new BigNumber(0) })
                ]}
            />
        </SwapTokensListContentWrapper>
    );
};
