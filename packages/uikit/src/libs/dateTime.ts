import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import calendar from 'dayjs/plugin/calendar';
import 'dayjs/locale/en';
import 'dayjs/locale/ru';

dayjs.extend(calendar);
dayjs.extend(relativeTime);
dayjs.extend(localizedFormat);

export const manualUnixTime = (date: number, format: string) => {
    return dayjs.unix(date).format(format);
};

export const unixTimeToTimestamp = (date: number) => {
    return dayjs.unix(date).format('DD.MM.YYYY, HH:mm:ss');
};

export const calendarDate = (date: Date) => {
    return dayjs(date).format('DD MMM, YYYY');
};

export const manualDateFormat = (date: Date, format: string) => {
    return dayjs(date).format(format);
};

const sameDayTranslations = {
    en: 'Today at',
    ru: 'Сегодня в'
};

const prevDayTranslations = {
    en: 'yesterday at',
    ru: 'вчера в'
};

export const timeFromNow = (date: number, locale: 'en' | 'ru' = 'en') => {
    const oneDay = 1000 * 60 * 60 * 24;
    const now = new Date();
    const dt = new Date(date);
    const delta = now.getTime() - dt.getTime();

    if (delta < oneDay) {
        return dayjs(dt).locale(locale).fromNow();
    }

    const conf = {
        sameDay: `[${sameDayTranslations[locale]}] HH:mm`,
        lastDay: `[${prevDayTranslations[locale]}] HH:mm`,
        lastWeek: 'DD MMM, HH:mm',
        sameElse: 'DD MMM YYYY'
    };

    if (now.getFullYear() === dt.getFullYear()) {
        conf.sameElse = 'DD MMM, HH:mm';
    }

    return dayjs(dt).locale(locale).calendar(null, conf);
};

export function getTimeRemaining(endTime: Date) {
    const now = new Date();
    const timeDifference = endTime.getTime() - now.getTime();

    const daysInt = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hoursInt = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesInt = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const secondsInt = Math.floor((timeDifference % (1000 * 60)) / 1000);

    const days = !!daysInt ? `${daysInt}d` : '';
    const hours = !!hoursInt ? `${hoursInt}h` : '';
    const minutes = !!minutesInt && !daysInt ? `${minutesInt}m` : '';
    const seconds = !!secondsInt && !hoursInt ? `${secondsInt}s` : '';

    return [days, hours, minutes, seconds].filter(Boolean).join(' ');
}
