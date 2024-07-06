import { atom, useAtom } from '../../libs/atom';
import { useCallback } from 'react';
import { useSwapsConfig } from './useSwapsConfig';
import { useAppSdk } from '../../hooks/appSdk';
import { swapFromAsset$, swapToAsset$ } from './useSwapForm';
import { useAppContext } from '../../hooks/appContext';
import { generateStonfiSwapLink } from '../stonfi';

const swapMobileNotificationOpen$ = atom(false);
export const useSwapMobileNotification = () => {
    const [isOpen, _setIsOpen] = useAtom(swapMobileNotificationOpen$);
    const { isSwapsEnabled } = useSwapsConfig();
    const sdk = useAppSdk();

    const { tonendpoint, env } = useAppContext();

    const setIsOpen = useCallback(
        (val: boolean) => {
            if (val && !isSwapsEnabled) {
                const swapLink = generateStonfiSwapLink(
                    swapFromAsset$.value.address,
                    swapToAsset$.value.address,
                    tonendpoint.targetEnv,
                    env?.stonfiReferralAddress
                );
                sdk.openPage(swapLink);
            } else {
                _setIsOpen(val);
            }
        },
        [_setIsOpen, isSwapsEnabled, sdk, tonendpoint.targetEnv, env?.stonfiReferralAddress]
    );

    return [isOpen, setIsOpen] as const;
};
