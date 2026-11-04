import React, { FC } from 'react';
import { Action } from './Actions';
import IcSwapHorizontal28 from '../../icons/components/IcSwapHorizontal28';
import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { TonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { useSwapFromAsset } from '../../state/swap/useSwapForm';

export const SwapAction: FC<{ fromAsset?: TonAsset }> = ({ fromAsset }) => {
    const [_, setIsOpen] = useSwapMobileNotification();
    const [__, setFromAsset] = useSwapFromAsset();

    const onAction = () => {
        if (fromAsset) {
            setFromAsset(fromAsset);
        }

        setIsOpen(true);
    };

    return (
        <Action
            icon={<IcSwapHorizontal28 className="h-7 w-7" />}
            title={'swap_title'}
            action={onAction}
        />
    );
};
