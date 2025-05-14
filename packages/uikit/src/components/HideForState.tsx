import { FC, PropsWithChildren } from 'react';
import { CountryFeature, useIsFeatureAvailableForRegulatoryState } from '../state/country';

export const HideForRegulatoryState: FC<PropsWithChildren<{ feature: CountryFeature }>> = ({
    feature,
    children
}) => {
    const available = useIsFeatureAvailableForRegulatoryState(feature);
    return available ? <>{children}</> : null;
};
