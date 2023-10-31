import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { useMemo } from 'react';
import { useTranslation } from './translation';

export function useDateFormat(
    date: number | Date | undefined | null,
    options?: Intl.DateTimeFormatOptions
): string {
    const { i18n } = useTranslation();

    return useMemo(() => {
        if (!date) {
            return '';
        }

        return new Intl.DateTimeFormat(intlLocale(i18n.language), {
            month: 'short',
            day: 'numeric',
            year:
                new Date().getFullYear() - 1 === new Date(date).getFullYear()
                    ? 'numeric'
                    : undefined,
            hour: 'numeric',
            minute: 'numeric',
            ...options
        }).format(date);
    }, [date, i18n.language, options]);
}

export function toDaysLeft(date: number | Date | undefined | null): string {
    if (!date) {
        return '';
    }

    const days = Math.floor((new Date(date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (days < 0) {
        return '0';
    }

    return days.toString();
}
