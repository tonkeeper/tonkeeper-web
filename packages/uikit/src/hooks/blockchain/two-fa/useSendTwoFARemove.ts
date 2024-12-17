import { useMutation } from '@tanstack/react-query';

import { useAnalyticsTrack } from '../../amplitude';
import { useActiveWallet, useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useNotifyErrorHandle } from '../../useNotification';
import { TWO_FA_SENDER_CHOICE, useGetSender } from '../useSender';
import { useMutateTwoFAWalletConfig, useTwoFAWalletConfig } from '../../../state/two-fa';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { TwoFAMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/two-fa-message-sender';

export function useSendTwoFARemove() {
    const track = useAnalyticsTrack();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const { data: twoFAWalletConfig } = useTwoFAWalletConfig();
    const wallet = useActiveWallet();
    const { mutateAsync: setTwoFAWalletConfig } = useMutateTwoFAWalletConfig();

    return useMutation<boolean, Error>(async () => {
        try {
            if (!twoFAWalletConfig || twoFAWalletConfig.status !== 'active') {
                throw new Error('Two FA config not valid, status: ' + twoFAWalletConfig?.status);
            }

            if (!isStandardTonWallet(wallet)) {
                throw new Error('Cant remove two fa plugin using this wallet');
            }

            const sender = (await getSender(TWO_FA_SENDER_CHOICE)) as TwoFAMessageSender;

            await sender.sendRemoveExtension();

            await setTwoFAWalletConfig(null);

            track('remove_2fa', {
                wallet: wallet.rawAddress
            });
        } catch (e) {
            await notifyError(e);
            return false;
        }

        await invalidateAccountQueries();
        return true;
    });
}
