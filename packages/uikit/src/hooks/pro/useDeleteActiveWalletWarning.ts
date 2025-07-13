import { isPaidSubscription } from '@tonkeeper/core/dist/entries/pro';

import { useAppSdk } from '../appSdk';
import { useProState } from '../../state/pro';
import { useTranslation } from '../translation';
import { useActiveWallet } from '../../state/wallet';

export const useDeleteActiveWalletWarning = () => {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { data: proState } = useProState();
    const activeWallet = useActiveWallet();

    return async () => {
        let isApprovedDeleting = true;

        if (!proState?.current || !isPaidSubscription(proState.current)) {
            return isApprovedDeleting;
        }

        if (activeWallet?.rawAddress !== proState?.current?.auth?.wallet?.rawAddress) {
            return isApprovedDeleting;
        }

        isApprovedDeleting = await sdk.confirm({
            message: t('deleting_disable_pro_access_description'),
            title: t('deleting_disable_pro_access'),
            cancelButtonTitle: t('cancel'),
            okButtonTitle: t('delete_wallet')
        });

        return isApprovedDeleting;
    };
};
