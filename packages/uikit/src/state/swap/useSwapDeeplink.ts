import {
    findSwapAssetByDeeplinkToken,
    SwapDeeplinkParams
} from '@tonkeeper/core/dist/service/deeplinkingService';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from '../../hooks/router/useNavigate';
import { useAllSwapAssets } from './useSwapAssets';
import { useSwapFromAsset, useSwapToAsset } from './useSwapForm';

const pendingSwapDeeplinkParams$ = atom<SwapDeeplinkParams | undefined>(undefined);

const toSearchParams = (params: SwapDeeplinkParams) => {
    const searchParams = new URLSearchParams();

    if (params.fromToken) {
        searchParams.set('ft', params.fromToken);
    }

    if (params.toToken) {
        searchParams.set('tt', params.toToken);
    }

    return searchParams;
};

const getSwapDeeplinkParamsFromSearch = (search: string): SwapDeeplinkParams | undefined => {
    const searchParams = new URLSearchParams(search);
    const fromToken = searchParams.get('ft') || undefined;
    const toToken = searchParams.get('tt') || undefined;

    return fromToken || toToken ? { fromToken, toToken } : undefined;
};

export const useOpenSwapDeeplink = () => {
    const navigate = useNavigate();

    return useCallback(
        (params: SwapDeeplinkParams) => {
            pendingSwapDeeplinkParams$.next(params);
            const searchParams = toSearchParams(params);
            const search = searchParams.toString();

            navigate(`${AppRoute.swap}${search ? `?${search}` : ''}`);
        },
        [navigate]
    );
};

export const useApplySwapDeeplinkParams = () => {
    const location = useLocation();
    const history = useHistory();
    const { data: allAssets } = useAllSwapAssets();
    const [, setFromAsset] = useSwapFromAsset();
    const [, setToAsset] = useSwapToAsset();

    useEffect(() => {
        const params = getSwapDeeplinkParamsFromSearch(location.search);
        if (params) {
            pendingSwapDeeplinkParams$.next(params);
        }
    }, [location.search]);

    useEffect(() => {
        const params = pendingSwapDeeplinkParams$.value;

        if (!params || !allAssets?.length) {
            return;
        }

        const fromAsset = params.fromToken
            ? findSwapAssetByDeeplinkToken(allAssets, params.fromToken)
            : undefined;
        const toAsset = params.toToken
            ? findSwapAssetByDeeplinkToken(allAssets, params.toToken)
            : undefined;

        if (fromAsset) {
            setFromAsset(fromAsset);
        }

        if (toAsset) {
            setToAsset(toAsset);
        }

        pendingSwapDeeplinkParams$.next(undefined);

        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has('ft') || searchParams.has('tt')) {
            searchParams.delete('ft');
            searchParams.delete('tt');
            history.replace({
                ...location,
                search: searchParams.toString()
            });
        }
    }, [allAssets, history, location, setFromAsset, setToAsset]);
};
