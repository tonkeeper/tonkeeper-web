import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';
import {
    getGlobalPreferences,
    setGlobalPreferences,
    GlobalPreferences
} from '@tonkeeper/core/dist/service/globalPreferencesService';

export const useGlobalPreferencesQuery = () => {
    const sdk = useAppSdk();
    return useQuery(
        [QueryKey.globalPreferencesConfig],
        async () => {
            return getGlobalPreferences(sdk.storage);
        },
        {
            keepPreviousData: true,
            structuralSharing: false,
            suspense: true
        }
    );
};

export const useGlobalPreferences = () => {
    const { data } = useGlobalPreferencesQuery();
    if (!data) {
        throw new Error('No global preferences');
    }
    return data;
};

export const useMutateGlobalPreferences = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, Partial<GlobalPreferences>>(async preferences => {
        await setGlobalPreferences(sdk.storage, preferences);
        await client.invalidateQueries([QueryKey.globalPreferencesConfig]);
    });
};
