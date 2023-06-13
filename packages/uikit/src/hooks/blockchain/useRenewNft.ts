import {RecipientData} from "@tonkeeper/core/dist/entries/send";
import {Fee, NftItemRepr} from "@tonkeeper/core/dist/tonApiV1";
import {sendNftRenew} from "@tonkeeper/core/dist/service/transfer/nftService";
import {useExecuteContract} from "./useExecuteContract";

export const useRenewNft = (
    nftItem: NftItemRepr,
    fee?: Fee
) => {
    return useExecuteContract(params => sendNftRenew({
        ...params,
        nftAddress: nftItem.address,
        fee: fee!,
    }), () => fee ? { exitWith: false } : undefined);
};
