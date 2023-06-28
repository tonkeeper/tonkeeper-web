import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { useExecuteContract } from '../useExecuteContract';

export const useRenewNft = () =>
  useExecuteContract(sendNftRenew, 'renew_dns', 'renew-dns');
