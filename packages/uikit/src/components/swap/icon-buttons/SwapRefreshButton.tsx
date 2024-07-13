import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { RefreshIcon, RefreshIconAnimated } from '../../Icon';
import { useCalculatedSwap } from '../../../state/swap/useCalculatedSwap';
import { useEffect, useState } from 'react';

let isRefetchCalled = false;

export const SwapRefreshButton = () => {
    const REFETCH_INTERVAL = 15000;
    const { refetch, isFetching } = useCalculatedSwap();
    const [isCounting, setIsCounting] = useState(false);

    useEffect(() => {
        isRefetchCalled = false;

        if (isFetching) {
            setIsCounting(false);
        } else {
            setIsCounting(true);

            const timeutId = setTimeout(() => {
                // prevent double refresh from possible two component instances
                if (isRefetchCalled) {
                    return;
                }

                refetch();
                isRefetchCalled = true;
            }, REFETCH_INTERVAL);

            return () => clearTimeout(timeutId);
        }
    }, [isFetching]);

    return (
        <IconButtonTransparentBackground onClick={() => refetch()}>
            {isCounting ? <RefreshIconAnimated /> : <RefreshIcon />}
        </IconButtonTransparentBackground>
    );
};
