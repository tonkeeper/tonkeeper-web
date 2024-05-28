import { styled } from 'styled-components';
import React, { FC, Fragment, useEffect, useRef, useState } from 'react';
import { Body2, Body3, Label2 } from '../../Text';
import {
    useAddUserCustomSwapAsset,
    useSwapCustomTokenSearch,
    WalletSwapAsset
} from '../../../state/swap/useSwapAssets';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useAppContext } from '../../../hooks/appContext';
import { isTon, TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { LinkOutIcon, SpinnerIcon } from '../../Icon';
import { ConfirmImportNotification } from './ConfirmImportNotification';
import { useAppSdk } from '../../../hooks/appSdk';
import { throttle } from '@tonkeeper/core/dist/utils/common';
import { useTranslation } from '../../../hooks/translation';

const SwapTokensListWrapper = styled.div`
    overflow-y: auto;
    width: calc(100% + 2rem);
    margin: 0 -1rem;
    height: calc(100% - 54px);

    &::-webkit-scrollbar {
        display: none;
    }

    -ms-overflow-style: none;
    scrollbar-width: none;
`;

const Divider = styled.div`
    width: 100%;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

export const SwapTokensList: FC<{
    walletSwapAssets: WalletSwapAsset[];
    onSelect: (asset: TonAsset) => void;
}> = ({ walletSwapAssets, onSelect }) => {
    const [displayingAssets, setDisplayingAssets] = useState(walletSwapAssets.slice(0, 25));
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        setDisplayingAssets(walletSwapAssets.slice(0, 25));
    }, [walletSwapAssets]);

    const onScroll = () => {
        if (!ref?.current) {
            return;
        }
        const scrollHeightLeft =
            ref.current.scrollHeight - ref.current.clientHeight - ref.current.scrollTop;

        if (scrollHeightLeft < 300) {
            setDisplayingAssets(d => walletSwapAssets.slice(0, d.length + 25));
        }
    };

    return (
        <SwapTokensListWrapper ref={ref} onScroll={throttle(onScroll, 100)}>
            {walletSwapAssets.length ? (
                displayingAssets.map((swapAsset, index) => (
                    <Fragment key={swapAsset.assetAmount.asset.id}>
                        <TokenListItem
                            onClick={() => onSelect(swapAsset.assetAmount.asset)}
                            swapAsset={swapAsset}
                        />
                        {index !== walletSwapAssets.length - 1 && <Divider />}
                    </Fragment>
                ))
            ) : (
                <TokenNotFound onSelect={onSelect} />
            )}
        </SwapTokensListWrapper>
    );
};

const TokensNotFoundContainer = styled.div`
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${p => p.theme.textSecondary};
`;

const TokenNotFound: FC<{ onSelect: (asset: TonAsset) => void }> = ({ onSelect }) => {
    const { t } = useTranslation();
    const { data: swapAsset, isFetching } = useSwapCustomTokenSearch();
    const [isOpened, setIsOpened] = useState(false);
    const { mutate } = useAddUserCustomSwapAsset();

    if (isFetching) {
        return (
            <TokensNotFoundContainer>
                <SpinnerIcon />
            </TokensNotFoundContainer>
        );
    }

    if (!swapAsset) {
        return (
            <TokensNotFoundContainer>
                <Body2>{t('swap_tokens_not_found')}</Body2>
            </TokensNotFoundContainer>
        );
    }

    const onClose = (confirmed?: boolean) => {
        setIsOpened(false);
        if (confirmed) {
            mutate(swapAsset.assetAmount.asset);
            onSelect(swapAsset.assetAmount.asset);
        }
    };

    return (
        <>
            <ConfirmImportNotification
                isOpen={isOpened}
                onClose={onClose}
                tokenSymbol={swapAsset.assetAmount.asset.symbol}
            />
            <TokenListItem onClick={() => setIsOpened(true)} swapAsset={swapAsset} />
        </>
    );
};

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
    gap: 4px;

    > *:first-child {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    > *:nth-child(3) {
        margin-left: auto;
    }
`;

const LinkOutIconWrapper = styled.div`
    cursor: pointer;
    &:hover {
        > svg {
            color: ${p => p.theme.iconSecondary};
        }
    }
`;

const TokenInfoSecondLine = styled(TokenInfoLine)`
    color: ${p => p.theme.textSecondary};

    > *:nth-child(2) {
        margin-left: auto;
    }
`;

const BalanceLabel = styled(Label2)<{ isZero: boolean }>`
    color: ${p => (p.isZero ? p.theme.textTertiary : p.theme.textPrimary)};
`;

const TokenListItem: FC<{ swapAsset: WalletSwapAsset; onClick: () => void }> = ({
    swapAsset,
    onClick
}) => {
    const isZeroBalance = swapAsset.assetAmount.relativeAmount.isZero();
    const { fiat } = useAppContext();
    const sdk = useAppSdk();

    const onOpenExplorer = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();

        let explorerUrl;
        if (isTon(swapAsset.assetAmount.asset.address)) {
            explorerUrl = 'https://tonviewer.com/price';
        } else {
            explorerUrl = `https://tonviewer.com/${swapAsset.assetAmount.asset.address.toString({
                urlSafe: true
            })}`;
        }

        sdk.openPage(explorerUrl);
    };

    return (
        <TokenListItemWrapper onClick={onClick}>
            <TokenImage src={swapAsset.assetAmount.asset.image} />
            <TokenInfo>
                <TokenInfoLine>
                    <Label2>{swapAsset.assetAmount.asset.symbol}</Label2>
                    <LinkOutIconWrapper onClick={onOpenExplorer}>
                        <LinkOutIcon />
                    </LinkOutIconWrapper>
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
