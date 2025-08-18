import { FC, PropsWithChildren } from 'react';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

export const IfFeatureEnabled: FC<PropsWithChildren<{ feature: FLAGGED_FEATURE }>> = ({
    children,
    feature
}) => {
    const isEnabled = useIsFeatureEnabled(feature);

    return isEnabled ? <>{children}</> : null;
};
