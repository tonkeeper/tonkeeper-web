import { intlLocale } from '@tonkeeper/core/dist/entries/language';
import { useTranslation } from './translation';

export function useDateTimeFormat() {
    const { i18n } = useTranslation();
    return (date: Date | string | number, options?: Parameters<typeof Intl.DateTimeFormat>[1]) =>
        Intl.DateTimeFormat(intlLocale(i18n.language), options).format(new Date(date));
}
