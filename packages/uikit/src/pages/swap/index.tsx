import { useSwapMobileNotification } from '../../state/swap/useSwapMobileNotification';
import { Navigate } from 'react-router-dom';

export default () => {
    const [_, setIsOpen] = useSwapMobileNotification();
    setIsOpen(true);

    return <Navigate to=".." replace={true} />;
};
