import { useCallback } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

export const useNavigate = () => {
    const history = useHistory();
    const location = useLocation();

    return useCallback(
        (path: string | -1, options: { relative?: 'path'; replace?: boolean } = {}) => {
            if (path === -1) {
                history.goBack();
            } else {
                let finalPath = path;

                if (options.relative === 'path') {
                    finalPath = location.pathname.endsWith('/')
                        ? location.pathname + path
                        : location.pathname + '/' + path;
                }

                if (options.replace) {
                    history.replace(finalPath);
                } else {
                    history.push(finalPath);
                }
            }
        },
        [history, location]
    );
};
