import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';

import { useNavigate } from './useNavigate';

/**
 * Back-button handler that survives deep links. `history.goBack()` on a
 * location the app didn't push (page opened directly via URL) walks out of
 * the SPA — to `about:blank` in a fresh tab. The router only assigns a
 * `location.key` to entries it pushed itself, so a missing key means there
 * is no in-app history and we route to `fallback` instead.
 */
export const useNavigateBack = (fallback: string) => {
    const navigate = useNavigate();
    const location = useLocation();

    return useCallback(() => {
        if (location.key) {
            navigate(-1);
        } else {
            navigate(fallback, { replace: true });
        }
    }, [navigate, location.key, fallback]);
};
