import { Navigate, useLocation } from 'react-router-dom';

export const RedirectFromDesktopSettings = () => {
    const location = useLocation();
    const newPath = location.pathname.replace('/wallet-settings', '/settings');

    return <Navigate to={newPath} replace />;
};
