import { useQuery } from '@tanstack/react-query';
import { QueryKey } from '../libs/queryKey';
import { useAppContext } from '../hooks/appContext';
import { useMemo } from 'react';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';

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

export enum CountryFeature {
    swap = 'swap',
    gasless = 'gasless',
    battery = 'battery'
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
                    case CountryFeature.gasless:
                    case CountryFeature.battery:
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
