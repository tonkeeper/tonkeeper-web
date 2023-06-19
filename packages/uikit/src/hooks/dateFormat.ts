import {useMemo} from "react";
import {useTranslation} from "./translation";

export function useDateFormat(date: number | Date | undefined): string {
    const {i18n} = useTranslation();

    return useMemo(() => {
        if (!date) {
            return '';
        }

        return new Intl.DateTimeFormat(i18n.language, {
            month: 'short',
            day: 'numeric',
            year:
                new Date().getFullYear() - 1 === new Date(date).getFullYear()
                    ? 'numeric'
                    : undefined,
            hour: 'numeric',
            minute: 'numeric',
        }).format(date);
    }, [date, i18n.language]);
}
