import { useHistory, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

export function useSearchParams() {
    const location = useLocation();
    const history = useHistory();
    const searchParams = new URLSearchParams(location.search);

    const setSearchParams = useCallback(
        (
            newParams: Record<string, string> | URLSearchParams,
            options: { replace?: boolean } = {}
        ) => {
            const newSearchParams = new URLSearchParams(newParams);
            const newLocation = {
                ...location,
                search: newSearchParams.toString()
            };
            if (options.replace) {
                history.replace(newLocation);
            } else {
                history.push(newLocation);
            }
        },
        [location, history]
    );

    return [searchParams, setSearchParams] as const;
}
