import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IAppSdk } from '@tonkeeper/core/dist/AppSdk';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { useAppSdk } from '../hooks/appSdk';
import { QueryKey } from '../libs/queryKey';

export interface CountryIs {
    country: string;
    ip: string;
}

const getMyCountryCode = async (sdk: IAppSdk) => {
    const url = 'https://api.country.is';
    try {
        const country = await sdk.storage.get<string>(url);
        if (country) return country;

        const response = await fetch(url);
        const json: CountryIs = await response.json();
        await sdk.storage.set<string>(url, json.country);
        return json.country;
    } catch (e) {
        return null;
    }
};

export const useCountrySetting = () => {
    const sdk = useAppSdk();
    return useQuery<string | null, Error>([QueryKey.country, 'store'], async () => {
        return await sdk.storage.get<string>(AppKey.COUNTRY);
    });
};

export const useAutoCountry = () => {
    const sdk = useAppSdk();
    return useQuery<string | null, Error>([QueryKey.country, 'detect'], async () => {
        return await getMyCountryCode(sdk);
    });
};

export const useUserCountry = () => {
    const sdk = useAppSdk();
    return useQuery<string | null, Error>([QueryKey.country], async () => {
        let code = await sdk.storage.get<string>(AppKey.COUNTRY);
        if (!code) {
            code = await getMyCountryCode(sdk);
        }
        return code;
    });
};

export const useMutateUserCountry = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();
    return useMutation<void, Error, string | undefined>(async value => {
        if (value) {
            await sdk.storage.set(AppKey.COUNTRY, value);
        } else {
            await sdk.storage.delete(AppKey.COUNTRY);
        }
        await client.invalidateQueries([QueryKey.country]);
    });
};
