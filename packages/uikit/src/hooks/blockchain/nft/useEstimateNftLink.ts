import { estimateNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useEstimateTonFee } from '../useEstimateTonFee';
import BigNumber from 'bignumber.js';

export const useEstimateNftLink = (args: {
    nftAddress: string;
    linkToAddress: string;
    amount: BigNumber;
}) => {
    return useEstimateTonFee(
        {
            caller: estimateNftLink,
            queryKey: ['estimate-link-nft', args.nftAddress, args.linkToAddress]
        },
        args
    );
};
