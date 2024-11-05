import { useInfiniteQuery } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import {
    isTon,
    TonAsset,
    tonAssetAddressToString
} from '@tonkeeper/core/dist/entries/crypto/asset/ton-asset';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { AccountEvents, AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useCallback, useEffect } from 'react';
import { useAppContext } from '../hooks/appContext';
import { atom, useAtom } from '../libs/atom';
import { QueryKey } from '../libs/queryKey';
import { useGlobalPreferences, useMutateGlobalPreferences } from './global-preferences';
import { MixedActivity } from './mixedActivity';
import { seeIfTonTransfer } from './ton/tonActivity';
import { useActiveApi, useActiveWallet } from './wallet';

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

export type GenericActivity<T> = { timestamp: number; key: string; event: T };
export type GenericActivityGroup<T> = [string, GenericActivity<T>[]];

export const groupGenericActivity = <T>(list: GenericActivity<T>[]) => {
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
    }, {} as Record<string, GenericActivity<T>[]>);

    const result = [] as GenericActivityGroup<T>[];
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

export const groupActivityGeneric = <T>(
    list: T[],
    toTimestamp: (item: T) => number,
    toKey: (item: T) => string
): GenericActivityGroup<T>[] => {
    const activity = list.map(item => ({
        timestamp: toTimestamp(item),
        key: toKey(item),
        event: item
    }));
    return groupGenericActivity(activity);
};

export const useFetchFilteredActivity = (asset?: string) => {
    const wallet = useActiveWallet();
    const api = useActiveApi();
    const { asset: selectedAsset, filterSpam, onlyInitiator } = useHistoryFilters();

    return useInfiniteQuery({
        queryKey: [
            wallet.rawAddress,
            QueryKey.activity,
            asset,
            selectedAsset?.id,
            onlyInitiator,
            filterSpam
        ],
        queryFn: async ({ pageParam = undefined }) => {
            let activity: AccountEvents;
            if (!asset && !selectedAsset) {
                activity = await new AccountsApi(api.tonApiV2).getAccountEvents({
                    accountId: wallet.rawAddress,
                    limit: 20,
                    beforeLt: pageParam,
                    subjectOnly: true,
                    initiator: onlyInitiator ? onlyInitiator : undefined
                });
            } else {
                let assetTonApiId: string;
                if (selectedAsset) {
                    assetTonApiId = tonAssetAddressToString(selectedAsset.address);
                }
                if (asset) {
                    assetTonApiId =
                        asset.toLowerCase() === CryptoCurrency.TON.toLowerCase() ? 'TON' : asset;
                }

                if (assetTonApiId! === 'TON') {
                    activity = await new AccountsApi(api.tonApiV2).getAccountEvents({
                        accountId: wallet.rawAddress,
                        limit: 20,
                        beforeLt: pageParam,
                        subjectOnly: true,
                        initiator: onlyInitiator ? onlyInitiator : undefined
                    });

                    activity.events = activity.events.filter(event => {
                        event.actions = event.actions.filter(seeIfTonTransfer);
                        return event.actions.length > 0;
                    });
                } else {
                    activity = await new AccountsApi(api.tonApiV2).getAccountJettonHistoryByID({
                        accountId: wallet.rawAddress,
                        jettonId: assetTonApiId!,
                        limit: 20,
                        beforeLt: pageParam
                    });
                }
            }

            if (filterSpam) {
                activity.events = activity.events.filter(event => !event.isScam);
            }
            return activity;
        },
        getNextPageParam: lastPage => (lastPage.nextFrom > 0 ? lastPage.nextFrom : undefined)
    });
};

export type GroupedActivityItemSingle = {
    type: 'single';
    item: GenericActivity<MixedActivity>;
    key: string;
};

export type GroupedActivityItemGroup = {
    type: 'group';
    items: GenericActivity<MixedActivity>[];
    category: 'spam'; // probably will be other groupBy categories in the future
    key: string;
};

export type GroupedActivityItem = GroupedActivityItemSingle | GroupedActivityItemGroup;

export type GroupedActivity = GroupedActivityItem[];

export const defaultHistoryFilters = {
    asset: undefined,
    onlyInitiator: false,
    filterSpam: false
};

const historyFilters$ = atom<{
    asset: TonAsset | undefined;
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
        (asset: TonAsset | undefined) => {
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

export const isInitiatorFiltrationForAssetAvailable = (asset: TonAsset | undefined): boolean => {
    if (!asset) {
        return true;
    }
    return isTon(asset.address);
};
