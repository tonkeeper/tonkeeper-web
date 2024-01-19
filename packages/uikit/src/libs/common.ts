import { MutableRefObject, Ref, RefCallback } from 'react';

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
