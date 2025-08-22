import { useCallback } from 'react';
import { useSwapsConfig } from './useSwapsConfig';
import { useAppSdk } from '../../hooks/appSdk';
import { swapFromAsset$, swapToAsset$ } from './useSwapForm';
import { generateStonfiSwapLink } from '../stonfi';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useAtom } from '../../libs/useAtom';
import { useActiveConfig } from '../wallet';

const swapMobileNotificationOpen$ = atom(false);
export const useSwapMobileNotification = () => {
    const [isOpen, _setIsOpen] = useAtom(swapMobileNotificationOpen$);
    const { isSwapsEnabled } = useSwapsConfig();
    const sdk = useAppSdk();
    const config = useActiveConfig();

    const setIsOpen = useCallback(
        (val: boolean) => {
            if (val && !isSwapsEnabled) {
                const swapLink = generateStonfiSwapLink(
                    swapFromAsset$.value.address,
                    swapToAsset$.value.address,
                    config.tonkeeper_utm_track,
                    config.stonfi_direct_link_referral_address
                );
                sdk.openPage(swapLink);
            } else {
                _setIsOpen(val);
            }
        },
        [
            _setIsOpen,
            isSwapsEnabled,
            sdk,
            config.tonkeeper_utm_track,
            config.stonfi_direct_link_referral_address
        ]
    );

    return [isOpen, setIsOpen] as const;
};
