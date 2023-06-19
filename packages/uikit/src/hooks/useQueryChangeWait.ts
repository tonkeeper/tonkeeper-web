import { UseQueryResult } from "@tanstack/react-query";
import {useCallback, useEffect, useRef, useState} from "react";

export function useQueryChangeWait<T>(query:  Pick<UseQueryResult<T, Error>, 'data' | 'refetch'>, shouldExit: ((data: T, prevData: T | undefined) => boolean)) {
    const [isLoading, setIsLoading] = useState(false);
    const [dispose, setDispose] = useState(false);
    const prev = useRef(query.data);


    const waitRecursive = useCallback(async () => {
        const result = await query.refetch();
        if (shouldExit(result.data!, prev.current) || dispose) {
            setIsLoading(false);
            return;
        }

        prev.current = result.data;
        setTimeout(waitRecursive, 1000);
    }, [query.refetch, shouldExit, dispose]);

    useEffect(() => () => setDispose(true), [])

   return {
        isLoading,
        data: query.data,
        refetch: () => {
            setIsLoading(true);
            waitRecursive();
        }
   }
}
