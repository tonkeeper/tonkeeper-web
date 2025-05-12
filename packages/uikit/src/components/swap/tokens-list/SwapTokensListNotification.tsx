import { Notification } from '../../Notification';
import { FC, useCallback } from 'react';
import { useAtom } from '../../../libs/useAtom';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { css, styled } from 'styled-components';
import { SwapSearchInput } from './SwapSearchInput';
import { SwapTokensList } from './SwapTokensList';
import { useWalletFilteredSwapAssets } from '../../../state/swap/useSwapAssets';
import { SpinnerIcon } from '../../Icon';
import { useTranslation } from '../../../hooks/translation';
import { atom } from '@tonkeeper/core/dist/entries/atom';

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

const NotificationStyled = styled(Notification)`
    padding-bottom: 0;
`;

export const SwapTokensListNotification: FC = () => {
    const { t } = useTranslation();
    const [onSelect, setIsOpen] = useAtom(swapTokensListOpened$);

    const onClose = (asset: TonAsset | undefined) => {
        onSelect?.onClose(asset);
        setIsOpen(undefined);
    };

    return (
        <>
            <NotificationStyled
                isOpen={!!onSelect}
                handleClose={() => onClose(undefined)}
                title={t('swap_tokens')}
                footer={<div />}
                mobileFullScreen
            >
                {() => <SwapTokensListContent onSelect={onClose} />}
            </NotificationStyled>
        </>
    );
};

const SwapSearchInputStyled = styled(SwapSearchInput)`
    margin-bottom: 1rem;
`;

const SwapTokensListContentWrapper = styled.div`
    ${p =>
        p.theme.proDisplayType === 'desktop'
            ? css`
                  height: 580px;
              `
            : p.theme.proDisplayType === 'mobile'
            ? css`
                  height: calc(var(--app-height) - env(safe-area-inset-bottom));
              `
            : css`
                  height: calc(var(--app-height) - 8rem);
              `}
`;

const Divider = styled.div`
    width: calc(100% + 2rem);
    margin: 0 -1rem;
    height: 1px;
    background-color: ${p => p.theme.separatorCommon};
`;

const SpinnerContainer = styled.div`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 300px;
`;

const SwapTokensListContent: FC<{ onSelect: (token: TonAsset | undefined) => void }> = ({
    onSelect
}) => {
    const walletSwapAssets = useWalletFilteredSwapAssets();

    return (
        <SwapTokensListContentWrapper>
            <SwapSearchInputStyled isDisabled={!walletSwapAssets} />
            <Divider />
            {walletSwapAssets ? (
                <SwapTokensList onSelect={onSelect} walletSwapAssets={walletSwapAssets} />
            ) : (
                <SpinnerContainer>
                    <SpinnerIcon />
                </SpinnerContainer>
            )}
        </SwapTokensListContentWrapper>
    );
};
