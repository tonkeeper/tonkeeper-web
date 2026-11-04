import { FC, useEffect, useState } from 'react';

import { useAppSdk } from '../../../hooks/appSdk';
import { MultichainScanButton } from './MultichainScanButton';

/**
 * Renders the scan button in the header's positioning context and counts
 * the `scan` uiEvents it asks the shell's scanner sheet for.
 */
export const MultichainScanButtonHarness: FC = () => {
    const sdk = useAppSdk();
    const [scans, setScans] = useState(0);

    useEffect(() => {
        const handler = () => setScans(n => n + 1);
        sdk.uiEvents.on('scan', handler);
        return () => {
            sdk.uiEvents.off('scan', handler);
        };
    }, [sdk.uiEvents]);

    return (
        <div className="relative h-16 w-[390px] text-iconSecondary">
            <MultichainScanButton />
            <p className="absolute right-4 top-1/2 -translate-y-1/2 text-body2 text-textPrimary">
                Scans: {scans}
            </p>
        </div>
    );
};
