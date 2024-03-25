import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export const useEnableW5 = () => {
    const sdk = useAppSdk();
    return useQuery<boolean, Error>([QueryKey.experimental, 'w5'], async () => {
        const state = await sdk.storage.get<boolean>(`${QueryKey.experimental}_w5`);
        return state ?? false;
    });
};

export const useEnableW5Mutation = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, void>(async () => {
        const state = await sdk.storage.get<boolean>(`${QueryKey.experimental}_w5`);
        await sdk.storage.set(`${QueryKey.experimental}_w5`, !state);
        await client.invalidateQueries([QueryKey.experimental]);
    });
};
