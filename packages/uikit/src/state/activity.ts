export const formatActivityDate = (language: string, key: string, timestamp: number): string => {
    const date = new Date(timestamp * 1000);

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
    const date = new Date(timestamp * 1000);
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
    const date = new Date(timestamp * 1000);

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

export const groupActivityGeneric = <T>(
    list: T[],
    toTimestamp: (item: T) => number,
    toKey: (item: T) => string
): GenericActivityGroup<T>[] => {
    list.sort((a, b) => toTimestamp(b) - toTimestamp(a));

    const todayDate = new Date();
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);

    const { today, yesterday, ...rest } = list.reduce((acc, item) => {
        const group = getEventGroup(toTimestamp(item), todayDate, yesterdayDate);
        if (acc[group]) {
            acc[group].push(item);
        } else {
            acc[group] = [item];
        }
        return acc;
    }, {} as Record<string, T[]>);

    const mapGroup = (list: T[]): GenericActivity<T>[] => {
        return list.map(item => ({ timestamp: toTimestamp(item), key: toKey(item), event: item }));
    };

    const result = [] as GenericActivityGroup<T>[];
    if (today) {
        result.push(['today', mapGroup(today)]);
    }
    if (yesterday) {
        result.push(['yesterday', mapGroup(yesterday)]);
    }

    Object.entries(rest)
        .filter(([key]) => key.startsWith('month'))
        .forEach(([key, items]) => {
            const r: GenericActivityGroup<T> = [key, mapGroup(items)];
            result.push(r);
        });

    Object.entries(rest)
        .filter(([key]) => key.startsWith('year'))
        .forEach(([key, items]) => {
            const r: GenericActivityGroup<T> = [key, mapGroup(items)];
            result.push(r);
        });

    return result;
};
