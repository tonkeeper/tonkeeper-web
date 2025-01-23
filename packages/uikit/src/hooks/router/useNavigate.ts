import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useShouldReplaceNav } from './useShouldReplaceNav';
import { useIonRouter } from '@ionic/react';

export const useNavigate = () => {
    const history = useHistory();
    const location = useLocation();
    const replaceNavigate = useShouldReplaceNav();
    const ionRouter = useIonRouter();

    return useCallback(
        (path: string | -1, options: { relative?: 'path'; replace?: boolean } = {}) => {
            if (path === -1) {
                if (ionRouter.routeInfo !== undefined) {
                    ionRouter.goBack();
                } else {
                    history.goBack();
                }
            } else {
                let finalPath = path;

                if (options.relative === 'path') {
                    finalPath = location.pathname.endsWith('/')
                        ? location.pathname + path
                        : location.pathname + '/' + path;
                }

                const shouldReplace =
                    options.replace || (options.replace === undefined && replaceNavigate);

                if (ionRouter.routeInfo !== undefined) {
                    if (shouldReplace) {
                        ionRouter.push(finalPath, 'forward', 'replace');
                    } else {
                        ionRouter.push(finalPath, 'forward', 'push');
                    }
                } else {
                    if (shouldReplace) {
                        history.replace(finalPath);
                    } else {
                        history.push(finalPath);
                    }
                }
            }
        },
        [history, location, replaceNavigate, ionRouter]
    );
};
