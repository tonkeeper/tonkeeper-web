import { FC, PropsWithChildren } from 'react';
import { CountryFeature, seeIfFeatureAvailable, useUserCountry } from '../state/country';

export const HideForRegulatoryState: FC<PropsWithChildren<{ feature: CountryFeature }>> = ({
    feature,
    children
}) => {
    const { data } = useUserCountry();
    const available = seeIfFeatureAvailable(feature, data);
    return available ? <>{children}</> : null;
};
