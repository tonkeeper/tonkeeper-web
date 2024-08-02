import { BLOCKCHAIN_NAME } from '@tonkeeper/core/dist/entries/crypto';
import { memo, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'styled-components';
import { ActivityIcon, BrowserIcon, NftIcon, WalletIcon } from '../../components/NavigationIcons';
import { SkeletonAction } from '../../components/Skeleton';
import { ActionsRow } from '../../components/home/Actions';
import { Balance, BalanceSkeleton } from '../../components/home/Balance';
import { HomeActions } from '../../components/home/TonActions';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppSdk } from '../../hooks/appSdk';
import { useTranslation } from '../../hooks/translation';
import { scrollToTop } from '../../libs/common';
import { AppRoute } from '../../libs/routes';
import { useAssets } from '../../state/home';

import { useWalletFilteredNftList } from "../../state/nft";

const MainColumnSkeleton = memo(() => {
    const sdk = useAppSdk();
    useEffect(() => {
        return () => {
            sdk.uiEvents.emit('loading');
        };
    }, []);

    return (
        <>
            <BalanceSkeleton />
            <ActionsRow>
                <SkeletonAction />
                <SkeletonAction />
                <SkeletonAction />
                {/* <SkeletonAction /> */}
            </ActionsRow>
        </>
    );
});

const Navigation = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const navigate = useNavigate();

    const { data: nfts } = useWalletFilteredNftList();

    const active = useMemo<AppRoute>(() => {
        if (location.pathname.includes(AppRoute.activity)) {
            return AppRoute.activity;
        }
        if (location.pathname.includes(AppRoute.browser)) {
            return AppRoute.browser;
        }
        if (location.pathname.includes(AppRoute.purchases)) {
            return AppRoute.purchases;
        }
        return AppRoute.home;
    }, [location.pathname]);

    const theme = useTheme();
    const items = useMemo<SettingsItem[]>(() => {
        const handleClick = (route: AppRoute) => {
            if (location.pathname !== route) {
                return navigate(route);
            } else {
                scrollToTop();
            }
        };

        const items: SettingsItem[] = [
            {
                name: t('wallet_title'),
                icon: <WalletIcon />,
                iconColor:
                    active === AppRoute.home ? theme.tabBarActiveIcon : theme.tabBarInactiveIcon,
                action: () => handleClick(AppRoute.home)
            },
            {
                name: t('browser_title'),
                icon: <BrowserIcon />,
                iconColor:
                    active === AppRoute.browser ? theme.tabBarActiveIcon : theme.tabBarInactiveIcon,
                action: () => handleClick(AppRoute.browser)
            },
            {
                name: t('activity_screen_title'),
                icon: <ActivityIcon />,
                iconColor:
                    active === AppRoute.activity
                        ? theme.tabBarActiveIcon
                        : theme.tabBarInactiveIcon,
                action: () => handleClick(AppRoute.activity)
            }
        ];
        if (nfts && nfts.length > 0) {
            items.push({
                name: t('purchases_screen_title'),
                icon: <NftIcon />,
                iconColor:
                    active === AppRoute.purchases
                        ? theme.tabBarActiveIcon
                        : theme.tabBarInactiveIcon,
                action: () => handleClick(AppRoute.purchases)
            });
        }
        return items;
    }, [t, location, navigate, active, theme, nfts]);

    return <SettingsList items={items} />;
};

export const MainColumn = () => {
    const [assets, error, isAssetLoading] = useAssets();

    if (!assets) {
        return <MainColumnSkeleton />;
    }

    return (
        <>
            <Balance assets={assets} error={error} isFetching={isAssetLoading} />
            <HomeActions chain={BLOCKCHAIN_NAME.TON} />
            <Navigation />
        </>
    );
};
