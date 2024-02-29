import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { useTranslation } from './translation';

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
