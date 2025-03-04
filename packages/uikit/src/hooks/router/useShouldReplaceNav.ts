import { AppRoute } from '../../libs/routes';
import { useLocation } from 'react-router-dom';
import { useAppTargetEnv } from '../appSdk';

export const useShouldReplaceNav = () => {
    const location = useLocation();
    const targetEnv = useAppTargetEnv();
    return targetEnv === 'mobile' && location.pathname !== AppRoute.home;
};
