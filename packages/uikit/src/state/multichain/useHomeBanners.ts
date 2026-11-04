import { useQuery } from '@tanstack/react-query';
import { HomeBanner } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';

import { useAppContext } from '../../hooks/appContext';
import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';
import { useActiveAccount } from '../wallet';

const hiddenKey = (walletId: string) => `home-banners-hidden:${walletId}`;

export const useHomeBanners = () => {
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const { tonendpoint } = useAppContext();
    const walletId = multichainApiWalletCredentials(account)?.walletId ?? account.id;

    return useQuery<HomeBanner[]>(
        [QueryKey.tonkeeperApi, 'home-banners', walletId],
        async () => {
            const [banners, hidden] = await Promise.all([
                tonendpoint.banners(walletId),
                sdk.storage.get<string[]>(hiddenKey(walletId))
            ]);
            const hiddenIds = new Set(hidden ?? []);
            return banners.filter(banner => !hiddenIds.has(banner.id));
        },
        { staleTime: 5 * 60 * 1000 }
    );
};

export const hideHomeBanner = async (
    storage: ReturnType<typeof useAppSdk>['storage'],
    walletId: string,
    bannerId: string
) => {
    const key = hiddenKey(walletId);
    const hidden = (await storage.get<string[]>(key)) ?? [];
    if (!hidden.includes(bannerId)) await storage.set(key, [...hidden, bannerId]);
};
