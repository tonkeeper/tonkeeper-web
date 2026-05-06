import { useProcessOpenedLink } from '../../components/connect/connectHook';
import { useOpenSwapDeeplink } from './useSwapDeeplink';
import {
    useOpenBatteryDeeplink,
    useOpenBrowserDeeplink,
    useOpenBuyTonDeeplink,
    useOpenPoolDeeplink
} from './useNavigationDeeplinks';

export const useDeeplinkHandlers = (options?: {
    hideLoadingToast?: boolean;
    hideErrorToast?: boolean;
    withBattery?: boolean;
}) => {
    const openSwapDeeplink = useOpenSwapDeeplink();
    const openPoolDeeplink = useOpenPoolDeeplink();
    const openBuyTonDeeplink = useOpenBuyTonDeeplink();
    const openBatteryDeeplink = useOpenBatteryDeeplink();
    const openBrowserDeeplink = useOpenBrowserDeeplink();

    return useProcessOpenedLink({
        hideLoadingToast: options?.hideLoadingToast,
        hideErrorToast: options?.hideErrorToast,
        onSwapDeeplink: openSwapDeeplink,
        onPoolDeeplink: openPoolDeeplink,
        onBuyTonDeeplink: openBuyTonDeeplink,
        onBatteryDeeplink: options?.withBattery ? openBatteryDeeplink : undefined,
        onBrowserDeeplink: openBrowserDeeplink
    });
};
