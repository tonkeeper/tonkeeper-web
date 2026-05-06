import { useCallback } from 'react';
import { useNavigate } from '../router/useNavigate';
import { AppRoute, StakingRoute, WalletSettingsRoute } from '../../libs/routes';
import { useBuyNotification } from '../../components/modals/BuyNotificationControlled';
import { PoolDeeplinkParams } from '@tonkeeper/core/dist/service/deeplinkingService';

export const useOpenPoolDeeplink = () => {
    const navigate = useNavigate();
    return useCallback(
        (params: PoolDeeplinkParams) => {
            navigate(AppRoute.staking + StakingRoute.pool + '/' + params.poolAddress);
        },
        [navigate]
    );
};

export const useOpenBuyTonDeeplink = () => {
    const { onOpen } = useBuyNotification();
    return useCallback(() => {
        onOpen();
    }, [onOpen]);
};

export const useOpenBatteryDeeplink = () => {
    const navigate = useNavigate();
    return useCallback(() => {
        navigate(AppRoute.walletSettings + WalletSettingsRoute.battery);
    }, [navigate]);
};

export const useOpenBrowserDeeplink = () => {
    const navigate = useNavigate();
    return useCallback(() => {
        navigate(AppRoute.browser);
    }, [navigate]);
};
