import { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

export function useQueryChangeWait<T>(
    query: Pick<UseQueryResult<T, Error>, 'data' | 'refetch'>,
    shouldExit: (data: T, prevData: T | undefined) => boolean
) {
    const [isLoading, setIsLoading] = useState(false);
    const [isCompleted, setIsCompleted] = useState(false);
    const [dispose, setDispose] = useState(false);
    const prev = useRef(query.data);

    const waitRecursive = async () => {
        const result = await query.refetch();

        if (dispose) {
            setIsLoading(false);
        }

        if (shouldExit(result.data!, prev.current)) {
            setIsLoading(false);
            setIsCompleted(true);
            return;
        }

        prev.current = result.data;
        setTimeout(waitRecursive, 1000);
    };

    useEffect(() => () => setDispose(true), []);

    return {
        isLoading,
        isCompleted,
        data: query.data,
        refetch: (timeLimit = 10000) => {
            prev.current = query.data;
            setIsLoading(true);
            setDispose(false);
            setIsCompleted(false);
            setTimeout(() => {
                if (isLoading) {
                    setDispose(true);
                }
            }, timeLimit);
            waitRecursive();
        }
    };
}
