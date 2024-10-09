import { estimateNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import BigNumber from 'bignumber.js';
import { useEstimateTonFee } from '../useEstimateTonFee';

export const useEstimateNftRenew = (args: { nftAddress: string; amount: BigNumber }) => {
    return useEstimateTonFee(
        { caller: estimateNftRenew, queryKey: ['estimate-nft-renew', args.nftAddress] },
        args
    );
};
