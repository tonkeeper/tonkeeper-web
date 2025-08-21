import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';

export const useUserCountry = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<string | null, Error>(
        [QueryKey.country],
        async () => {
            const response = await tonendpoint.country();
            return response.country;
        },
        {
            keepPreviousData: true
        }
    );
};
