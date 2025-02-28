import { useInfiniteQuery } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    isTon,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { AccountEvent, AccountEvents, AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { atom, useAtom } from '../libs/atom';
import { QueryKey } from '../libs/queryKey';
import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';
import { seeIfExtraCurrencyTransfer, seeIfTonTransfer } from './ton/tonActivity';
import { useActiveApi, useActiveWallet } from './wallet';
import { debounce, seeIfValidTonAddress } from '@tonkeeper/core/dist/utils/common';
import { useTwoFAWalletConfig } from './two-fa';
import { useActiveTronWallet, useTronApi } from './tron/tron';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { TonContract } from '@tonkeeper/core/dist/entries/wallet';
import { TronApi, TronHistoryItem } from '@tonkeeper/core/dist/tronApi';
import { TRON_USDT_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { Asset, isTonAsset } from '@tonkeeper/core/dist/entries/crypto/asset/asset';
import { useBatteryAuthToken } from './battery';

export const formatActivityDate = (language: string, key: string, timestamp: number): string => {
    const date = new Date(timestamp);
    language = intlLocale(language);

    if (date.getFullYear() < new Date().getFullYear()) {
        return new Intl.DateTimeFormat(language, {
            day: 'numeric',
            month: 'short'
        }).format(date);
    } else if (key.startsWith('year')) {
        return new Intl.DateTimeFormat(language, {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    } else {
        return new Intl.DateTimeFormat(language, { timeStyle: 'short' }).format(date);
    }
};

const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const getActivityTitle = (language: string, key: string, timestamp: number) => {
    language = intlLocale(language);

    if (key === 'today') {
        return capitalize(
            new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(0, 'day')
        );
    }
    if (key === 'yesterday') {
        return capitalize(
            new Intl.RelativeTimeFormat(language, { numeric: 'auto' }).format(-1, 'day')
        );
    }
    const date = new Date(timestamp);
    if (key.startsWith('month')) {
        return capitalize(
            new Intl.DateTimeFormat(language, {
                day: 'numeric',
                month: 'long'
            }).format(date)
        );
    } else if (date.getFullYear() < new Date().getFullYear()) {
        return capitalize(
            new Intl.DateTimeFormat(language, {
                month: 'long',
                year: 'numeric'
            }).format(date)
        );
    } else {
        return capitalize(
            new Intl.DateTimeFormat(language, {
                month: 'long'
            }).format(date)
        );
    }
};

const getEventGroup = (timestamp: number, today: Date, yesterday: Date): string => {
    const date = new Date(timestamp);

    if (today.toDateString() === date.toDateString()) {
        return 'today';
    }
    if (yesterday.toDateString() === date.toDateString() && today.getMonth() === date.getMonth()) {
        return 'yesterday';
    }
    if (today.getMonth() === date.getMonth() && today.getFullYear() === date.getFullYear()) {
        return `month-${date.getDate()}`;
    }

    return `year-${date.getFullYear()}-${date.getMonth() + 1}`;
};

type ActivityItemCommon = { timestamp: number; key: string };
type ActivityItemTon = ActivityItemCommon & { type: 'ton'; event: AccountEvent };
type ActivityItemTron = ActivityItemCommon & { type: 'tron'; event: TronHistoryItem };

export type ActivityItem = ActivityItemTon | ActivityItemTron;
export type ActivityItemsDatedGroup = [string, ActivityItem[]];

export const groupActivityItems = (list: ActivityItem[]) => {
    list.sort((a, b) => b.timestamp - a.timestamp);

    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const { today, yesterday, ...rest } = list.reduce((acc, item) => {
        const group = getEventGroup(item.timestamp, todayDate, yesterdayDate);
        if (acc[group]) {
            acc[group].push(item);
        } else {
            acc[group] = [item];
        }
        return acc;
    }, {} as Record<string, ActivityItem[]>);

    const result = [] as ActivityItemsDatedGroup[];
    if (today) {
        result.push(['today', today]);
    }
    if (yesterday) {
        result.push(['yesterday', yesterday]);
    }

    Object.entries(rest)
        .filter(([key]) => key.startsWith('month'))
        .forEach(item => result.push(item));

    Object.entries(rest)
        .filter(([key]) => key.startsWith('year'))
        .forEach(item => result.push(item));

    return result;
};

export const useFetchFilteredActivity = (assetAddress?: string) => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const { asset: selectedAsset, filterSpam, onlyInitiator } = useHistoryFilters();
    const { data: twoFAConfig } = useTwoFAWalletConfig();
    const twoFaPlugin = twoFAConfig?.status === 'active' ? twoFAConfig.pluginAddress : undefined;
    const tronApi = useTronApi();
    const tronWallet = useActiveTronWallet();
    const { data: batteryAuthToken } = useBatteryAuthToken();

    const query = useInfiniteQuery({
        queryKey: [
            wallet.rawAddress,
            QueryKey.activity,
            assetAddress,
            selectedAsset?.id,
            onlyInitiator,
            filterSpam,
            twoFaPlugin,
            tronWallet,
            batteryAuthToken
        ],
        queryFn: async ({ pageParam = undefined }) => {
            let assetTonApiId: string | undefined;
            let isTronUSDTAsset = false;
            if (selectedAsset) {
                if (selectedAsset.id === TRON_USDT_ASSET.id) {
                    isTronUSDTAsset = true;
                } else if (isTonAsset(selectedAsset)) {
                    assetTonApiId = tonAssetAddressToString(selectedAsset.address);
                }
            }
            if (assetAddress) {
                if (assetAddress === TRON_USDT_ASSET.address) {
                    isTronUSDTAsset = true;
                } else {
                    assetTonApiId =
                        assetAddress.toLowerCase() === CryptoCurrency.TON.toLowerCase()
                            ? 'TON'
                            : assetAddress;
                }
            }

            const emptyResult = Promise.resolve({
                nextFrom: 0,
                events: []
            });

            const [tonActivity, tronActivity] = await Promise.all([
                isTronUSDTAsset
                    ? emptyResult
                    : fetchTonActivity({
                          pageParam: pageParam?.tonNextFrom,
                          assetTonApiId,
                          api,
                          wallet,
                          onlyInitiator,
                          filterSpam,
                          twoFaPluginAddress: twoFaPlugin
                      }),
                assetTonApiId
                    ? emptyResult
                    : fetchTronActivity({
                          tronApi,
                          tronWalletAddress: tronWallet?.address,
                          pageParam: pageParam?.tronNextFrom,
                          onlyInitiator,
                          filterSpam,
                          batteryAuthToken: batteryAuthToken ?? undefined
                      })
            ]);

            return {
                tonNextFrom: tonActivity.nextFrom,
                tronNextFrom: tronActivity.nextFrom,
                events: sortAndPackActivityItems(tonActivity.events, tronActivity.events)
            };
        },
        getNextPageParam: lastPage =>
            lastPage.tronNextFrom > 0 || lastPage.tonNextFrom > 0
                ? { tonNextFrom: lastPage.tonNextFrom, tronNextFrom: lastPage.tronNextFrom }
                : undefined,
        keepPreviousData: true
    });

    const data = query.data ? query.data.pages.flatMap(i => i.events) : undefined;

    return { ...query, data };
};

const sortAndPackActivityItems = (
    tonItems: AccountEvent[],
    tronItems: TronHistoryItem[]
): ActivityItem[] => {
    return [
        ...tonItems.map(
            item =>
                ({
                    type: 'ton' as const,
                    timestamp: item.timestamp * 1000,
                    key: item.eventId,
                    event: item
                } satisfies ActivityItemTon)
        ),
        ...tronItems.map(
            item =>
                ({
                    type: 'tron' as const,
                    timestamp: item.timestamp,
                    key: item.transactionHash,
                    event: item
                } satisfies ActivityItemTron)
        )
    ].sort((a, b) => b.timestamp - a.timestamp);
};

async function fetchTronActivity({
    tronApi,
    tronWalletAddress,
    pageParam,
    onlyInitiator,
    filterSpam,
    batteryAuthToken
}: {
    tronApi: TronApi;
    tronWalletAddress?: string;
    pageParam?: number;
    onlyInitiator: boolean;
    filterSpam: boolean;
    batteryAuthToken: string | undefined;
}) {
    if (pageParam === 0 || !tronWalletAddress) {
        return {
            nextFrom: 0,
            events: []
        };
    }

    const pageLimit = 20;

    const tronActivity = await tronApi.getTransfersHistory(
        tronWalletAddress,
        {
            limit: pageLimit,
            maxTimestamp: pageParam ? pageParam - 1 : undefined,
            onlyInitiator,
            filterSpam
        },
        batteryAuthToken
    );

    const nextFrom =
        tronActivity.length < pageLimit ? 0 : tronActivity[tronActivity.length - 1].timestamp;

    return {
        nextFrom,
        events: tronActivity
    };
}

async function fetchTonActivity({
    pageParam = undefined,
    assetTonApiId,
    api,
    wallet,
    onlyInitiator,
    filterSpam,
    twoFaPluginAddress
}: {
    pageParam?: number;
    assetTonApiId?: string;
    api: APIConfig;
    wallet: TonContract;
    onlyInitiator: boolean;
    filterSpam: boolean;
    twoFaPluginAddress?: string;
}) {
    if (pageParam === 0) {
        return {
            nextFrom: 0,
            events: []
        };
    }

    let tonActivity: AccountEvents;
    if (!assetTonApiId) {
        tonActivity = await new AccountsApi(api.tonApiV2).getAccountEvents({
            accountId: wallet.rawAddress,
            limit: 20,
            beforeLt: pageParam,
            subjectOnly: true,
            initiator: onlyInitiator ? onlyInitiator : undefined
        });
    } else {
        if (seeIfValidTonAddress(assetTonApiId)) {
            tonActivity = await new AccountsApi(api.tonApiV2).getAccountJettonHistoryByID({
                accountId: wallet.rawAddress,
                jettonId: assetTonApiId!,
                limit: 20,
                beforeLt: pageParam
            });
        } else if (assetTonApiId === 'TON') {
            tonActivity = await new AccountsApi(api.tonApiV2).getAccountEvents({
                accountId: wallet.rawAddress,
                limit: 20,
                beforeLt: pageParam,
                subjectOnly: true,
                initiator: onlyInitiator ? onlyInitiator : undefined
            });

            tonActivity.events = tonActivity.events.filter(event => {
                event.actions = event.actions.filter(seeIfTonTransfer);
                return event.actions.length > 0;
            });
        } else {
            tonActivity = await new AccountsApi(api.tonApiV2).getAccountEvents({
                accountId: wallet.rawAddress,
                limit: 20,
                beforeLt: pageParam,
                subjectOnly: true,
                initiator: onlyInitiator ? onlyInitiator : undefined
            });

            tonActivity.events = tonActivity.events.filter(event => {
                event.actions = event.actions.filter(seeIfExtraCurrencyTransfer(assetTonApiId));
                return event.actions.length > 0;
            });
        }
    }

    if (filterSpam) {
        tonActivity.events = tonActivity.events.filter(event => !event.isScam);
    }

    if (twoFaPluginAddress) {
        tonActivity.events = tonActivity.events.map(event => {
            if (
                event.actions[0].tonTransfer &&
                event.actions[0].tonTransfer.sender.address === twoFaPluginAddress
            ) {
                event.actions = event.actions.slice(1);
            }

            return event;
        });
    }

    return tonActivity;
}

export type CategorizedActivityItemSingle = {
    type: 'single';
    item: ActivityItem;
    key: string;
};

export type CategorizedActivityItemGroup = {
    type: 'group';
    items: ActivityItem[];
    category: 'spam'; // probably will be other groupBy categories in the future
    key: string;
};

export type CategorizedActivityItem = CategorizedActivityItemSingle | CategorizedActivityItemGroup;
export type CategorizedActivity = CategorizedActivityItem[];

export const defaultHistoryFilters = {
    asset: undefined,
    onlyInitiator: false,
    filterSpam: false
};

const historyFilters$ = atom<{
    asset: Asset | undefined;
    onlyInitiator: boolean;
    filterSpam: boolean;
}>(defaultHistoryFilters);

let isInited = false;

export const useHistoryFilters = () => {
    const [filters, setFilters] = useAtom(historyFilters$);
    const { historyFilterSpam } = useGlobalPreferences();
    const { mutate, reset } = useMutateGlobalPreferences();

    useEffect(() => {
        if (!isInited) {
            isInited = true;
            setFilters(f => ({ ...f, filterSpam: historyFilterSpam }));
        }
    }, [historyFilterSpam]);

    const toggleOnlyInitiator = useCallback(() => {
        setFilters(f => ({ ...f, onlyInitiator: !f.onlyInitiator }));
    }, [setFilters]);

    const toggleFilterSpam = useCallback(() => {
        reset();
        mutate({ historyFilterSpam: !filters.filterSpam });
        setFilters(f => ({ ...f, filterSpam: !f.filterSpam }));
    }, [setFilters, mutate, filters.filterSpam]);

    const setAsset = useCallback(
        (asset: Asset | undefined) => {
            setFilters(f => ({ ...f, asset }));
        },
        [setFilters]
    );

    return {
        ...filters,
        toggleOnlyInitiator,
        toggleFilterSpam,
        setAsset
    };
};

export const isInitiatorFiltrationForAssetAvailable = (asset: Asset | undefined): boolean => {
    if (!asset) {
        return true;
    }
    return !isTonAsset(asset) || isTon(asset.address);
};

export const useScrollMonitor = (
    elementRef: React.RefObject<HTMLDivElement>,
    timeout: number,
    callback: () => void
) => {
    const [isAtTop, setIsAtTop] = useState(true);

    useEffect(() => {
        const handleScroll = debounce(() => {
            if (elementRef.current && elementRef.current.scrollTop < 5) {
                setIsAtTop(true);
            } else {
                setIsAtTop(false);
            }
        }, 20);

        handleScroll();
        elementRef.current?.addEventListener('scroll', handleScroll);
        return () => {
            elementRef.current?.removeEventListener('scroll', handleScroll);
        };
    }, [elementRef.current]);

    useLayoutEffect(() => {
        const timer = setInterval(() => {
            if (isAtTop) {
                callback();
            }
        }, timeout);
        return () => {
            clearInterval(timer);
        };
    }, [isAtTop, callback]);
};
