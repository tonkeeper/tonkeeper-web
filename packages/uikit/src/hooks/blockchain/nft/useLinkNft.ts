import { sendNftLink } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useExecuteContract } from '../useExecuteContract';

export const useRenewNft = () => useExecuteContract(sendNftLink);
