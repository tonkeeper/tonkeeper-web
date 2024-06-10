import React, { FC } from 'react';
import { Action } from './Actions';
import { SwapIcon } from '../Icon';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { styled } from 'styled-components';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useSwapFromAsset } from '../../state/swap/useSwapForm';

const SwapIconStyled = styled(SwapIcon)`
    height: 24px;
    width: 24px;
    color: ${p => p.theme.iconPrimary};
`;

export const SwapAction: FC<{ fromAsset?: TonAsset }> = ({ fromAsset }) => {
    const [_, setIsOpen] = useSwapMobileNotification();
    const [__, setFromAsset] = useSwapFromAsset();

    const onAction = () => {
        if (fromAsset) {
            setFromAsset(fromAsset);
        }

        setIsOpen(true);
    };

    return <Action icon={<SwapIconStyled />} title={'swap_title'} action={onAction} />;
};
