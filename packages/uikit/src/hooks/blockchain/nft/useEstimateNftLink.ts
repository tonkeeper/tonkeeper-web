import { estimateNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useEstimateFee } from '../useEstimateFee';

export const useEstimateNftLink = () => {
  return useEstimateFee(estimateNftLink);
};
