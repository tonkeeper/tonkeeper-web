import { TransferOrigin } from '@tonkeeper/core/dist/AppSdk';

import { useProcessOpenedLink } from '../../components/connect/connectHook';
import { useOpenSwapDeeplink } from './useSwapDeeplink';
import {
    useOpenAddWalletDeeplink,
    useOpenBackupDeeplink,
    useOpenBatteryDeeplink,
    useOpenBrowserDeeplink,
    useOpenBuyTonDeeplink,
    useOpenDappDeeplink,
    useOpenDepositDeeplink,
    useOpenMainDeeplink,
    useOpenMigrationDeeplink,
    useOpenPoolDeeplink,
    useOpenReceiveDeeplink,
    useOpenStakingDeeplink,
    useOpenTradeAssetDeeplink,
    useOpenTradingDeeplink,
    useOpenWithdrawDeeplink
} from './useNavigationDeeplinks';
import { useOpenWalletConnectUri } from './useWalletConnectDeeplink';
import { useAppSdk } from '../appSdk';

export const useDeeplinkHandlers = (options?: {
    hideLoadingToast?: boolean;
    hideErrorToast?: boolean;
    withBattery?: boolean;
    origin?: TransferOrigin;
}) => {
    const sdk = useAppSdk();
    const openSwapDeeplink = useOpenSwapDeeplink();
    const openPoolDeeplink = useOpenPoolDeeplink();
    const openBuyTonDeeplink = useOpenBuyTonDeeplink();
    const openBatteryDeeplink = useOpenBatteryDeeplink();
    const openBrowserDeeplink = useOpenBrowserDeeplink();
    const openMigrationDeeplink = useOpenMigrationDeeplink();
    const openStakingDeeplink = useOpenStakingDeeplink();
    const openDepositDeeplink = useOpenDepositDeeplink();
    const openWithdrawDeeplink = useOpenWithdrawDeeplink();
    const openTradingDeeplink = useOpenTradingDeeplink();
    const openTradeAssetDeeplink = useOpenTradeAssetDeeplink();
    const openDappDeeplink = useOpenDappDeeplink();
    const openReceiveDeeplink = useOpenReceiveDeeplink();
    const openBackupDeeplink = useOpenBackupDeeplink();
    const openAddWalletDeeplink = useOpenAddWalletDeeplink();
    const openMainDeeplink = useOpenMainDeeplink();
    const openWalletConnectUri = useOpenWalletConnectUri();

    return useProcessOpenedLink({
        hideLoadingToast: options?.hideLoadingToast,
        hideErrorToast: options?.hideErrorToast,
        origin: options?.origin,
        onSwapDeeplink: openSwapDeeplink,
        onPoolDeeplink: openPoolDeeplink,
        onBuyTonDeeplink: openBuyTonDeeplink,
        onBatteryDeeplink: options?.withBattery ? openBatteryDeeplink : undefined,
        onBrowserDeeplink: openBrowserDeeplink,
        onMigrationDeeplink: openMigrationDeeplink,
        onStakingDeeplink: openStakingDeeplink,
        onDepositDeeplink: openDepositDeeplink,
        onWithdrawDeeplink: openWithdrawDeeplink,
        onTradingDeeplink: openTradingDeeplink,
        onTradeAssetDeeplink: openTradeAssetDeeplink,
        onDappDeeplink: openDappDeeplink,
        onReceiveDeeplink: openReceiveDeeplink,
        onBackupDeeplink: openBackupDeeplink,
        onAddWalletDeeplink: openAddWalletDeeplink,
        onMainDeeplink: openMainDeeplink,
        // Enabled on the shells that mount `MultichainConnectSubscription` to
        // answer relay pairings (web, desktop, mobile/tablet). The extension
        // uses in-page injection instead, and twa is unsupported. `open` is
        // itself `undefined` without a multichain account, so legacy profiles
        // treat wc: links as unsupported exactly as before.
        onWalletConnectUri: ['web', 'desktop', 'tablet', 'mobile'].includes(sdk.targetEnv)
            ? openWalletConnectUri
            : undefined
    });
};
