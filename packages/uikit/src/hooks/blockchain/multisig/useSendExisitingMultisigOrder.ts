import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { MultisigOrder } from '@tonkeeper/core/dist/tonApiV2';
import { getSigner } from '../../../state/mnemonic';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useAppSdk } from '../../appSdk';
import { useCheckTouchId } from '../../../state/password';
import { signOrder } from '@tonkeeper/core/dist/service/multisig/multisigService';
import { notifyError } from '../../../components/transfer/common';
import { useTranslation } from '../../translation';

export function useSendExisitingMultisigOrder(orderAddress: MultisigOrder['address']) {
    const { api } = useAppContext();
    const { data: multisigInfoData } = useActiveMultisigWalletInfo();
    const multisigInfoPromise = useAsyncQueryData(multisigInfoData);
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();
    const client = useQueryClient();
    const { t } = useTranslation();
    const { signerAccount, signerWallet } = useActiveMultisigAccountHost();

    return useMutation<boolean, Error>(async () => {
        try {
            const multisig = await multisigInfoPromise;
            if (!multisig) {
                throw new Error('Multisig not found');
            }

            const signer = await getSigner(sdk, signerAccount.id, checkTouchId, {
                walletId: signerWallet.id
            }).catch(() => null);
            if (signer === null) {
                throw new Error('Signer not found');
            }

            await signOrder({
                api,
                multisig,
                hostWallet: signerWallet,
                signer,
                orderAddress: orderAddress
            });

            await invalidateAccountQueries();
            return true;
        } catch (e) {
            await notifyError(client, sdk, t, e);
            throw e;
        }
    });
}
