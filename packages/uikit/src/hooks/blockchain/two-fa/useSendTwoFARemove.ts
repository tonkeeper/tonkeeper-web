import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAnalyticsTrack } from '../../amplitude';
import { useActiveWallet, useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useNotifyErrorHandle, useToast } from '../../useNotification';
import { TWO_FA_SENDER_CHOICE, useGetSender } from '../useSender';
import { useTwoFAWalletConfig } from '../../../state/two-fa';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { TwoFAMessageSender } from '@tonkeeper/core/dist/service/ton-blockchain/sender/two-fa-message-sender';
import { QueryKey } from '../../../libs/queryKey';
import { useTranslation } from '../../translation';

export function useSendTwoFARemove() {
    const track = useAnalyticsTrack();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const notifyError = useNotifyErrorHandle();
    const getSender = useGetSender();
    const { data: twoFAWalletConfig } = useTwoFAWalletConfig();
    const wallet = useActiveWallet();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { t } = useTranslation();

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

            queryClient.setQueryData([QueryKey.twoFARemovingProcess, wallet.id], true);

            track('remove_2fa', {
                wallet: wallet.rawAddress
            });
        } catch (e) {
            try {
                await notifyError(e);
            } catch {
                toast(t('please_try_again_later'));
            }
            return false;
        }

        await invalidateAccountQueries();
        return true;
    });
}
