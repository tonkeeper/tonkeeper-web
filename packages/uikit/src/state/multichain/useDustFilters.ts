import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
    DustFilterState,
    getDustFilterState,
    setDustFilterState
} from '@tonkeeper/core/dist/service/dustFilterService';

import { useAppSdk } from '../../hooks/appSdk';
import { QueryKey } from '../../libs/queryKey';

/**
 * The per-install dust-filter toggles. Asset and activity queries key on
 * these values and gate on the state being loaded, so a toggle flip
 * re-fetches them with the matching `hide_dust` — the filter runs
 * server-side, both feeds being cursor-paginated.
 */
export const useDustFilters = () => {
    const sdk = useAppSdk();
    return useQuery<DustFilterState>([QueryKey.dustFilters], () => getDustFilterState(sdk.storage));
};

export const useMutateDustFilters = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    return useMutation<void, Error, Partial<DustFilterState>>(async change => {
        const next = await setDustFilterState(sdk.storage, change);
        client.setQueryData([QueryKey.dustFilters], next);
    });
};
