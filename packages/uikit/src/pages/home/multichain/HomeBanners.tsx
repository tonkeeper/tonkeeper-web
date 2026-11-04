import { FC, useEffect, useMemo, useRef, useState } from 'react';
import { HomeBanner } from '@tonkeeper/core/dist/tonkeeperApi/tonendpoint';
import { multichainApiWalletCredentials } from '@tonkeeper/core/dist/service/chainkit/walletAuthService';
import { toWalletMode } from '@tonkeeper/core/dist/analytics/wallet-mapping';

import { useAnalyticsTrack } from '../../../hooks/analytics';
import { useAppSdk } from '../../../hooks/appSdk';
import { useDeeplinkHandlers } from '../../../hooks/deeplinks/useDeeplinkHandlers';
import { useActiveAccount } from '../../../state/wallet';
import { hideHomeBanner, useHomeBanners } from '../../../state/multichain/useHomeBanners';
import IcChevronRight12 from '../../../icons/components/IcChevronRight12';
import IcCloseSmall16 from '../../../icons/components/IcCloseSmall16';
import { cn } from '../../../libs/css';

const actionType = (payload: string) => {
    const value = payload.toLowerCase();
    const known = [
        'deposit',
        'withdraw',
        'swap',
        'staking',
        'battery',
        'send',
        'trade',
        'exchange'
    ];
    return (known.find(item => value.includes(item)) ??
        (value.includes('dapp') ? 'dapp' : 'other')) as
        | 'deposit'
        | 'withdraw'
        | 'swap'
        | 'staking'
        | 'battery'
        | 'send'
        | 'trade'
        | 'exchange'
        | 'dapp'
        | 'other';
};

export const HomeBanners: FC<{ className?: string }> = ({ className }) => {
    const { data = [] } = useHomeBanners();
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const track = useAnalyticsTrack();
    const { mutate: processDeeplink } = useDeeplinkHandlers({
        hideLoadingToast: true,
        withBattery: true
    });
    const walletId = multichainApiWalletCredentials(account)?.walletId ?? account.id;
    const walletMode = toWalletMode(account);
    const [dismissed, setDismissed] = useState<string[]>([]);
    const [index, setIndex] = useState(0);
    const viewed = useRef(new Set<string>());
    const banners = useMemo(
        () => data.filter(item => !dismissed.includes(item.id)),
        [data, dismissed]
    );
    const banner = banners[index % Math.max(banners.length, 1)];

    useEffect(() => {
        if (!banner || viewed.current.has(banner.id)) return;
        viewed.current.add(banner.id);
        void track({
            eventName: 'banner_view',
            banner_id: banner.id,
            wallet_mode: walletMode,
            from: 'home'
        });
    }, [banner, track, walletMode]);

    if (!banner) return null;

    const open = (item: HomeBanner) => {
        if (!item.button) return;
        void track({
            eventName: 'banner_click',
            banner_id: item.id,
            action: actionType(item.button.payload),
            wallet_mode: walletMode,
            from: 'home'
        });
        // The backend labels `tonkeeper://` payloads as `link`, and every
        // shell's `openPage` only opens http(s), so the scheme decides.
        const isWebUrl = /^https?:\/\//i.test(item.button.payload);
        if (item.button.type.toLowerCase() === 'deeplink' || !isWebUrl) {
            processDeeplink(item.button.payload);
        } else {
            void sdk.openPage(item.button.payload);
        }
    };
    const dismiss = () => {
        setDismissed(ids => [...ids, banner.id]);
        setIndex(0);
        void hideHomeBanner(sdk.storage, walletId, banner.id);
    };

    return (
        <div
            className={cn(
                'relative flex w-full cursor-pointer items-center overflow-hidden rounded-large bg-backgroundContent',
                className
            )}
        >
            <button
                type="button"
                className="peer flex min-w-0 flex-1 cursor-pointer items-center self-stretch text-left transition-colors duration-100 enabled:hover:bg-backgroundContentTint disabled:cursor-default"
                onClick={() => open(banner)}
                disabled={!banner.button}
            >
                <div className="flex min-w-0 flex-1 flex-col gap-1 py-3.5 pl-4 pr-2">
                    <div className="line-clamp-2 text-label1 text-textPrimary">{banner.title}</div>
                    <div className="flex items-center text-body3 text-textPrimary opacity-[0.64]">
                        <span className="line-clamp-2">
                            {banner.description || banner.button?.title}
                        </span>
                        {banner.button && (
                            <IcChevronRight12 className="size-3 shrink-0 self-start mt-[3px] ml-0.5" />
                        )}
                    </div>
                </div>
                {banner.image && (
                    <img
                        src={banner.image}
                        alt=""
                        className="min-h-[90px] w-[134px] shrink-0 self-stretch object-cover"
                    />
                )}
            </button>
            <button
                type="button"
                aria-label="Close banner"
                onClick={dismiss}
                className="absolute right-2.5 top-2.5 flex cursor-pointer items-start rounded-2xl bg-backgroundContent p-1 text-iconSecondary backdrop-blur-[48px] transition-colors duration-100 hover:text-iconPrimary [.peer:enabled:hover~&]:bg-backgroundContentTint"
            >
                <IcCloseSmall16 className="size-4" />
            </button>
            {banners.length > 1 && (
                <button
                    type="button"
                    aria-label="Show next banner"
                    onClick={() => setIndex(value => (value + 1) % banners.length)}
                    className="absolute bottom-1.5 right-2.5 cursor-pointer rounded-full bg-backgroundContentTint px-2 py-0.5 text-[10px] text-textSecondary transition-colors duration-100 hover:text-textPrimary"
                >
                    {(index % banners.length) + 1}/{banners.length}
                </button>
            )}
        </div>
    );
};
