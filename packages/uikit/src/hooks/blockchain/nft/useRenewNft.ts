import { sendNftRenew } from '@tonkeeper/core/dist/service/transfer/nftService';
import { Fee, NftItemRepr } from '@tonkeeper/core/dist/tonApiV1';
import BigNumber from 'bignumber.js';
import { useExecuteContract } from '../useExecuteContract';

export const useRenewNft = (
  nftItem: NftItemRepr,
  amount: BigNumber,
  fee?: Fee
) => {
  return useExecuteContract(
    (params) =>
      sendNftRenew({
        ...params,
        nftAddress: nftItem.address,
        fee: fee!,
        amount,
      }),
    () => (!fee ? { exitWith: true } : undefined)
  );
};
