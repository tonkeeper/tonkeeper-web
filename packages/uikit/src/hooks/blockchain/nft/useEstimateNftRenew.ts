import { estimateNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useEstimateFee } from '../useEstimateFee';

export const useEstimateNftRenew = () => {
    return useEstimateFee(estimateNftRenew);
};
