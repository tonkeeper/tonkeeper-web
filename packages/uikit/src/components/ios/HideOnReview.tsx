import { useIsOnIosReview } from '../../hooks/ios';
import { FC, PropsWithChildren } from 'react';

export const HideOnReview: FC<PropsWithChildren> = ({ children }) => {
    const isOnReview = useIsOnIosReview();

    if (isOnReview) {
        return null;
    }

    return <>{children}</>;
};
