import { IconButtonTransparentBackground } from '../../fields/IconButton';
import { RefreshIcon, RefreshIconAnimated } from '../../Icon';
import { useSwapConfirmation } from '../../../state/swap/useSwapStreamEffect';

export const SwapRefreshButton = () => {
    const { isFetching } = useSwapConfirmation();

    return (
        <IconButtonTransparentBackground>
            {isFetching ? <RefreshIconAnimated /> : <RefreshIcon />}
        </IconButtonTransparentBackground>
    );
};
