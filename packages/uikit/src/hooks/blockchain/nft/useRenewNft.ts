import {Fee, NftItemRepr} from "@tonkeeper/core/dist/tonApiV1";
import {sendNftRenew} from "@tonkeeper/core/dist/service/transfer/nftService";
import {useExecuteContract} from "../useExecuteContract";
import BigNumber from "bignumber.js";

export const useRenewNft = (
    nftItem: NftItemRepr,
    amount: BigNumber,
    fee?: Fee
) => {
    console.log('in-hook', fee);
    return useExecuteContract(params => sendNftRenew({
        ...params,
        nftAddress: nftItem.address,
        fee: fee!,
        amount
    }), () => !fee ? { exitWith: true } : undefined);
};
