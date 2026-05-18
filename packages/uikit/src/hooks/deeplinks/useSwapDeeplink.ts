import { SwapDeeplinkParams } from '@tonkeeper/core/dist/service/deeplinkingService';
import { atom } from '@tonkeeper/core/dist/entries/atom';
import { useCallback, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { AppRoute } from '../../libs/routes';
import { useNavigate } from '../router/useNavigate';
import { useSwapAssetSearch } from '../../state/swap/useSwapAssets';
import { useSwapFromAsset, useSwapToAsset } from '../../state/swap/useSwapForm';
import { useAtom } from '../../libs/useAtom';

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
    const [pendingParams, setPendingParams] = useAtom(pendingSwapDeeplinkParams$);
    const fromAsset = useSwapAssetSearch(pendingParams?.fromToken);
    const toAsset = useSwapAssetSearch(pendingParams?.toToken);
    const [, setFromAsset] = useSwapFromAsset();
    const [, setToAsset] = useSwapToAsset();

    useEffect(() => {
        const params = getSwapDeeplinkParamsFromSearch(location.search);
        if (params) {
            setPendingParams(params);
        }
    }, [location.search, setPendingParams]);

    useEffect(() => {
        if (!pendingParams) {
            return;
        }

        if (
            (pendingParams.fromToken && fromAsset === undefined) ||
            (pendingParams.toToken && toAsset === undefined)
        ) {
            return;
        }

        if (fromAsset) {
            setFromAsset(fromAsset);
        }

        if (toAsset) {
            setToAsset(toAsset);
        }

        setPendingParams(undefined);

        const searchParams = new URLSearchParams(location.search);
        if (searchParams.has('ft') || searchParams.has('tt')) {
            searchParams.delete('ft');
            searchParams.delete('tt');
            history.replace({
                ...location,
                search: searchParams.toString()
            });
        }
    }, [
        fromAsset,
        history,
        location,
        pendingParams,
        setFromAsset,
        setPendingParams,
        setToAsset,
        toAsset
    ]);
};
