import { useLocation } from 'react-router-dom';
import { Navigate } from '../../components/shared/Navigate';

export const RedirectFromDesktopSettings = () => {
    const location = useLocation();
    const newPath = location.pathname.replace('/wallet-settings', '/settings');

    return <Navigate to={newPath} replace />;
};
