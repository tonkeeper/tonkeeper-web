import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { Navigate } from '../../components/shared/Navigate';
import { useApplySwapDeeplinkParams } from '../../hooks/deeplinks/useSwapDeeplink';
import { useEffect, useState } from 'react';

export default () => {
    const [, setIsOpen] = useSwapMobileNotification();
    const [shouldRedirect, setShouldRedirect] = useState(false);

    useApplySwapDeeplinkParams();

    useEffect(() => {
        setIsOpen(true);
        setShouldRedirect(true);
    }, [setIsOpen]);

    return shouldRedirect ? <Navigate to=".." replace={true} /> : null;
};
