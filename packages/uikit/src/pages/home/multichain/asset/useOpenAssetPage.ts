import { useCallback } from 'react';

import { AssetViewSource, setAssetViewSource } from '../../../../hooks/analytics/asset-view';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { MultichainRoute } from '../../../../libs/routes';

/**
 * Opens the asset detail page, declaring the surface the user came from so the
 * page can report it on `asset_view`.
 */
export const useOpenAssetPage = () => {
    const navigate = useNavigate();

    return useCallback(
        (assetId: string, from: AssetViewSource = 'wallet_screen') => {
            setAssetViewSource(from);
            navigate(`${MultichainRoute.asset}/${encodeURIComponent(assetId)}`);
        },
        [navigate]
    );
};
