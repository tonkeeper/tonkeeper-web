import { MutableRefObject, Ref, RefCallback } from 'react';

export function mergeRefs<T>(...inputRefs: (Ref<T> | undefined)[]): Ref<T> | RefCallback<T> {
    const filteredInputRefs = inputRefs.filter(Boolean);

    if (filteredInputRefs.length <= 1) {
        return filteredInputRefs[0] || null;
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
