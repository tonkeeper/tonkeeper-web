import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useShouldReplaceNav } from './useShouldReplaceNav';
import { useIonRouter } from '@ionic/react';
import { atom } from '../../libs/atom';

export const ionRouterAnimation$ = atom(true);

export const useNavigate = () => {
    const history = useHistory();
    const location = useLocation();
    const replaceNavigate = useShouldReplaceNav();
    const ionRouter = useIonRouter();
    return useCallback(
        (
            path: string | -1,
            options: { relative?: 'path'; replace?: boolean; disableMobileAnimation?: boolean } = {}
        ) => {
            if (typeof path === 'string' && path.startsWith('.')) {
                options.relative = 'path';
                path = path.slice(1);
            }

            if (path === -1) {
                if (ionRouter.routeInfo !== undefined) {
                    ionRouter.goBack();
                } else {
                    history.goBack();
                }
            } else {
                let finalPath = path;

                if (options.relative === 'path') {
                    finalPath =
                        location.pathname.endsWith('/') || path.startsWith('/')
                            ? location.pathname + path
                            : location.pathname + '/' + path;
                }

                if (ionRouter.routeInfo !== undefined) {
                    const isStepBack = location.pathname.startsWith(finalPath);

                    let shouldReplace = options.replace;
                    if (shouldReplace === undefined) {
                        if (isStepBack) {
                            shouldReplace = false;
                        } else if (!finalPath.startsWith(location.pathname)) {
                            shouldReplace = true;
                        }
                    }

                    const executeIonNavigation = () => {
                        if (shouldReplace) {
                            ionRouter.push(finalPath, isStepBack ? 'back' : 'forward', 'replace');
                        } else {
                            ionRouter.push(finalPath, isStepBack ? 'back' : 'forward', 'push');
                        }
                    };

                    if (options.disableMobileAnimation) {
                        ionRouterAnimation$.next(false);

                        setTimeout(() => {
                            executeIonNavigation();

                            setTimeout(() => {
                                ionRouterAnimation$.next(true);
                            }, 100);
                        }, 100);
                    } else {
                        executeIonNavigation();
                    }
                } else {
                    if (options.replace) {
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
