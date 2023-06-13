import {RecipientData} from "@tonkeeper/core/dist/entries/send";
import {Configuration, Fee, NftItemRepr} from "@tonkeeper/core/dist/tonApiV1";
import {useTranslation} from "../translation";
import {useAppSdk} from "../appSdk";
import {useAppContext, useWalletContext} from "../appContext";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useSendFBAnalyticsEvent} from "../analytics";
import {getWalletPassword} from "../../state/password";
import {notifyError} from "../../components/transfer/common";
import {IStorage} from "@tonkeeper/core/dist/Storage";
import {WalletState} from "@tonkeeper/core/dist/entries/wallet";

export type ContractExecutor = (params: {
    storage: IStorage,
    tonApi: Configuration,
    walletState: WalletState,
    password: string
}) => Promise<void>;

export function useExecuteContract(
    executor: ContractExecutor,
    beforeMutation?: () => { exitWith: boolean } | undefined
)  {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const walletState = useWalletContext();
    const client = useQueryClient();
    const track = useSendFBAnalyticsEvent();

    return useMutation<boolean, Error>(async () => {
        const shouldExit = beforeMutation?.();
        if (shouldExit) {
            return shouldExit.exitWith;
        }

        const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
        if (password === null) return false;

        track('send_nft');
        try {
            await executor({
                storage: sdk.storage,
                tonApi,
                walletState,
                password
            })
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([walletState.active.rawAddress]);
        await client.invalidateQueries();
        return true;
    });
};
