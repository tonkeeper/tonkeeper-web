import { FC, PropsWithChildren } from 'react';
import { FLAGGED_FEATURE, useIsFeatureEnabled } from '../../state/tonendpoint';

export const IfFeatureEnabled: FC<
    PropsWithChildren<{ feature: FLAGGED_FEATURE; applied?: boolean }>
> = ({ children, feature, applied }) => {
    const isEnabled = useIsFeatureEnabled(feature);

    return isEnabled || applied === false ? <>{children}</> : null;
};
