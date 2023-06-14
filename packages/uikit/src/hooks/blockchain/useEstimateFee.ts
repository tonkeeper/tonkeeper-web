import {useTranslation} from "../translation";
import {useAppSdk} from "../appSdk";
import {useAppContext, useWalletContext} from "../appContext";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {notifyError} from "../../components/transfer/common";
import {Configuration, SendApi} from "@tonkeeper/core/dist/tonApiV1";
import {WalletState} from "@tonkeeper/core/dist/entries/wallet";
import {Omit} from "react-beautiful-dnd";

export type ContractCallerParams =  {
    tonApi: Configuration,
    walletState: WalletState
}


export function useEstimateFee<Args extends ContractCallerParams>(caller: (params: Args) => Promise<string>) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const walletState = useWalletContext();
    const client = useQueryClient();

    return useMutation(async (args: Omit<Args, 'tonApi' | 'walletState'>) => {
        try {
            const boc = await caller({ ...args, walletState, tonApi } as Args);
            const { fee } = await new SendApi(tonApi).estimateTx({
                sendBocRequest: { boc },
            });
            return fee;
        } catch (e) {
            await notifyError(client, sdk, t, e);
            throw e;
        }
    });
};
