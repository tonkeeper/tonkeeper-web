import {AmountData, RecipientData} from "@tonkeeper/core/dist/entries/send";
import {JettonsBalances} from "@tonkeeper/core/dist/tonApiV1";
import {useTranslation} from "../translation";
import {useAppSdk} from "../appSdk";
import {useAppContext, useWalletContext} from "../appContext";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {useSendFBAnalyticsEvent} from "../analytics";
import {getWalletPassword} from "../../state/password";
import {CryptoCurrency} from "@tonkeeper/core/dist/entries/crypto";
import {sendTonTransfer} from "@tonkeeper/core/dist/service/transfer/tonService";
import {sendJettonTransfer} from "@tonkeeper/core/dist/service/transfer/jettonService";
import {notifyError} from "../../components/transfer/common";

export const useSendNft = (
    recipient: RecipientData,
    amount: AmountData,
    jettons: JettonsBalances
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track = useSendFBAnalyticsEvent();

    return useMutation<boolean, Error>(async () => {
        const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
        if (password === null) return false;
        try {
            if (amount.jetton === CryptoCurrency.TON) {
                track('send_ton');
                await sendTonTransfer(
                    sdk.storage,
                    tonApi,
                    wallet,
                    recipient,
                    amount,
                    amount.fee,
                    password
                );
            } else {
                track('send_jetton');
                const [jettonInfo] = jettons.balances.filter(
                    (item) => item.jettonAddress === amount.jetton
                );
                await sendJettonTransfer(
                    sdk.storage,
                    tonApi,
                    wallet,
                    recipient,
                    amount,
                    jettonInfo,
                    amount.fee,
                    password
                );
            }
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([wallet.active.rawAddress]);
        await client.invalidateQueries();
        return true;
    });
};
