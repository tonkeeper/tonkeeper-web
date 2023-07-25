import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { AmountData, RecipientData } from '@tonkeeper/core/dist/entries/send';
import { sendJettonTransfer } from '@tonkeeper/core/dist/service/transfer/jettonService';
import { sendTonTransfer } from '@tonkeeper/core/dist/service/transfer/tonService';
import { JettonsBalances } from '@tonkeeper/core/dist/tonApiV1';
import { notifyError } from '../../components/transfer/common';
import { getWalletPassword } from '../../state/password';
import { useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export const useSendTransfer = (
    recipient: RecipientData,
    amount: AmountData,
    jettons: JettonsBalances
) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { tonApi } = useAppContext();
    const wallet = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();

    return useMutation<boolean, Error>(async () => {
        const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
        if (password === null) return false;
        try {
            if (amount.jetton === CryptoCurrency.TON) {
                track2('send-ton');
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
                track2('send-jetton');
                const [jettonInfo] = jettons.balances.filter(
                    item => item.jettonAddress === amount.jetton
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
