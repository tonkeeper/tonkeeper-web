const msInSec = 1000;
const msInMin = msInSec * 60;
const msInHour = msInMin * 60;
const msInDay = msInHour * 24;

function addStartZero(value: number): string {
    const strValue = value.toString();
    if (strValue.length === 1) {
        return `0${strValue}`;
    }
    return strValue;
}
export function toTimeLeft(ms: number, options?: { days?: boolean }): string {
    const days = options?.days ?? false;
    const { days: daysNumber, hours: hoursNumber, minutes, seconds } = toStructTimeLeft(ms);

    let result = '';
    let hours = hoursNumber;
    if (daysNumber) {
        if (days) {
            result = `${days} d`;

            if (!hours && !minutes && !seconds) {
                return result;
            }

            result += ' ';
        } else {
            hours = hours + daysNumber * 24;
        }
    }

    if (hours) {
        result += `${hours}:`;
    }

    result += `${addStartZero(minutes)}:${addStartZero(seconds)}`;

    return result;
}

export function toStructTimeLeft(ms: number): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
} {
    const days = Math.floor(ms / msInDay);
    ms = ms - msInDay * days;

    const hours = Math.floor(ms / msInHour);
    ms = ms - msInHour * hours;

    const minutes = Math.floor(ms / msInMin);
    ms = ms - msInMin * minutes;

    const seconds = Math.floor(ms / msInSec);
    return {
        days,
        hours,
        minutes,
        seconds
    };
}

export type DateSerialized<T> = T extends Date
    ? { __date: string }
    : T extends Array<infer U>
    ? DateSerialized<U>[]
    : T extends object
    ? { [K in keyof T]: DateSerialized<T[K]> }
    : T;

export function serializeDates<T>(obj: T): DateSerialized<T> {
    const visit = (value: unknown): unknown => {
        if (value instanceof Date) {
            return { __date: value.toISOString() };
        }

        if (Array.isArray(value)) {
            return value.map(visit);
        }

        if (value !== null && typeof value === 'object') {
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v)]));
        }

        return value;
    };

    return visit(obj) as DateSerialized<T>;
}

export function deserializeDates<T>(obj: DateSerialized<T> | null): T | null {
    const visit = (value: unknown): unknown => {
        if (value === null || value === undefined) {
            return value;
        }

        if (typeof value === 'object') {
            if (
                !Array.isArray(value) &&
                Object.keys(value).length === 1 &&
                '__date' in value &&
                typeof value.__date === 'string'
            ) {
                return new Date(value.__date);
            }

            if (Array.isArray(value)) {
                return value.map(visit);
            }

            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, visit(v)]));
        }

        return value;
    };

    return obj === null ? null : (visit(obj) as T);
}
