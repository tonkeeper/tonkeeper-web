import { estimateNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useEstimateTonFee } from '../useEstimateTonFee';
import BigNumber from 'bignumber.js';

export const useEstimateNftRenew = (args: { nftAddress: string; amount: BigNumber }) => {
    return useEstimateTonFee(
        { caller: estimateNftRenew, queryKey: ['estimate-nft-renew', args.nftAddress] },
        args
    );
};
