import { FC } from 'react';

import { useUserFiatQuery } from '../../../../state/fiat';
import { ChartPeriod } from '../../../../state/trading/useAssetCharts';
import { MultichainAssetChart } from './MultichainAssetChart';

// `useAssetCharts` reads the fiat through `useUserFiat`, which throws until
// the fiat query has resolved. App shells load it before any page mounts;
// the harness waits for it the same way.
export const ChartHarness: FC<{ assetId: string; period: ChartPeriod }> = ({ assetId, period }) => {
    const { data: fiat } = useUserFiatQuery();
    if (!fiat) return null;
    return (
        <div className="w-[390px] bg-backgroundPage">
            <MultichainAssetChart assetId={assetId} period={period} />
        </div>
    );
};
