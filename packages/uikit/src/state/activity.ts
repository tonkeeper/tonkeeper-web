import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { useInfiniteQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { AccountsApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAppContext } from '../hooks/appContext';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { seeIfTonTransfer } from './ton/tonActivity';
import { MixedActivity } from './mixedActivity';
import { useActiveWallet } from './wallet';

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

export const useFetchFilteredActivity = (asset: string) => {
    const wallet = useActiveWallet();
    const { api } = useAppContext();

    return useInfiniteQuery({
        queryKey: [wallet.rawAddress, QueryKey.activity, asset],
        queryFn: async ({ pageParam = undefined }) => {
            if (asset.toLowerCase() === CryptoCurrency.TON.toLowerCase()) {
                const activity = await new AccountsApi(api.tonApiV2).getAccountEvents({
                    accountId: wallet.rawAddress,
                    limit: 20,
                    beforeLt: pageParam,
                    subjectOnly: true
                });

                activity.events = activity.events.filter(event =>
                    event.actions.every(seeIfTonTransfer)
                );
                return activity;
            } else {
                return new AccountsApi(api.tonApiV2).getAccountJettonHistoryByID({
                    accountId: wallet.rawAddress,
                    jettonId: asset,
                    limit: 20,
                    beforeLt: pageParam
                });
            }
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
