import { MutableRefObject, Ref, RefCallback } from 'react';
import { intlLocale } from '@tonkeeper/core/dist/entries/language';

export const scrollToTop = () => {
    if (!document.body.classList.contains('top')) {
        const body = document.getElementById('body');
        if (body) {
            window.requestAnimationFrame(() => {
                body.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
            });
        } else {
            window.requestAnimationFrame(() => {
                window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
            });
        }
    }
};

export function mergeRefs<T>(...inputRefs: (Ref<T> | undefined)[]): Ref<T> | RefCallback<T> {
    const filteredInputRefs = inputRefs.filter(Boolean);

    if (filteredInputRefs.length <= 1) {
        const firstRef = filteredInputRefs[0];

        return firstRef || null;
    }

    return function mergedRefs(ref) {
        filteredInputRefs.forEach(inputRef => {
            if (typeof inputRef === 'function') {
                inputRef(ref);
            } else if (inputRef) {
                (inputRef as MutableRefObject<T | null>).current = ref;
            }
        });
    };
}

export function randomIntFromInterval(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1);

export const getLanguageName = (language: string, locale?: string) => {
    return capitalize(
        new Intl.DisplayNames([intlLocale(locale ?? language)], { type: 'language' }).of(
            intlLocale(language)
        ) ?? language
    );
};

export const getCountryName = (language: string, country: string) => {
    try {
        return (
            new Intl.DisplayNames([intlLocale(language)], {
                type: 'region'
            }).of(country) ?? country
        );
    } catch (e) {
        console.error(e);
        return country;
    }
};
