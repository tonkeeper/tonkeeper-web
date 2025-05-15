import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { useMemo } from 'react';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';

export const useUserCountry = () => {
    const { tonendpoint } = useAppContext();
    return useQuery<string | null, Error>([QueryKey.country], async () => {
        const response = await tonendpoint.country();
        return response.country;
    });
};

export enum CountryFeature {
    swap = 'swap'
}

export enum RegulatoryState {
    UK = 'UK',
    GB = 'GB'
}

export const useIsFeatureAvailableForRegulatoryState = (feature: CountryFeature) => {
    const { data: state } = useUserCountry();
    return useMemo(() => {
        if (!state) return false; // Till loading

        switch (state) {
            case RegulatoryState.GB:
            case RegulatoryState.UK: {
                switch (feature) {
                    case CountryFeature.swap:
                        return false;
                    default:
                        assertUnreachable(feature);
                }
            }
            default: {
                return true;
            }
        }
    }, [feature, state]);
};
