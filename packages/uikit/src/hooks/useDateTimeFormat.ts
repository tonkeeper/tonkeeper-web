import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { useTranslation } from './translation';
import { useMemo } from 'react';
import { timeFromNow } from '../libs/dateTime';

export function useDateTimeFormat() {
    const { i18n } = useTranslation();
    return (
        date: Date | string | number,
        options?: Parameters<typeof Intl.DateTimeFormat>[1] & { inputUnit?: 'seconds' | 'ms' }
    ) => {
        if (options?.inputUnit === 'seconds' && typeof date !== 'object') {
            date = new Date(Number(date) * 1000);
        }

        return Intl.DateTimeFormat(intlLocale(i18n.language), options).format(new Date(date));
    };
}

const i18LangToKnownDayjsLocale = (lang: string): 'ru' | 'en' => {
    if (lang.includes('ru')) {
        return 'ru';
    }

    return 'en';
};

export function useDateTimeFormatFromNow(timestamp: number) {
    const { i18n } = useTranslation();

    const lang = i18LangToKnownDayjsLocale(i18n.language);

    return useMemo(() => timeFromNow(timestamp, lang), [timestamp, lang]);
}
