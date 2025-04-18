import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { Navigate } from '../../components/shared/Navigate';

export default () => {
    const [_, setIsOpen] = useSwapMobileNotification();
    setIsOpen(true);

    return <Navigate to=".." replace={true} />;
};
