import { useCallback } from 'react';

import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { normalizeAnalyticsAssetId } from '@tonkeeper/core/dist/analytics/asset-id';

import { useAnalyticsTrack } from './index';

type AssetButton = Extract<AnalyticsEvent, { eventName: 'asset_button_click' }>['button'];

/**
 * Send / Receive and the swap Buy / Sell on the multichain asset page. The
 * cash buy / sell buttons are not reported — the native apps don't either.
 */
export const useTrackAssetButtonClick = () => {
    const track = useAnalyticsTrack();

    return useCallback(
        (button: AssetButton, assetId: string) =>
            track({
                eventName: 'asset_button_click',
                button,
                asset: normalizeAnalyticsAssetId(assetId)
            }),
        [track]
    );
};
