import { useEffect, useRef } from 'react';

const cancelablePromise = <T>() => {
    let resolve: (value: T) => void = () => {};

    const promise = new Promise<T>(r => {
        resolve = r;
    });

    return {
        promise,
        resolve
    };
};

export const useAsyncQueryData = <T>(data: T): Promise<T> => {
    const promiseRef = useRef(cancelablePromise<T>());

    useEffect(() => {
        if (data !== undefined) {
            promiseRef.current.resolve(data);
        }
    }, [data]);

    return promiseRef.current.promise;
};
