import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { useActiveMultisigAccountHost, useActiveMultisigWalletInfo } from '../../../state/multisig';
import { useAsyncQueryData } from '../../useAsyncQueryData';
import { getSigner } from '../../../state/mnemonic';
import { useInvalidateActiveWalletQueries } from '../../../state/wallet';
import { useAppSdk } from '../../appSdk';
import { useCheckTouchId } from '../../../state/password';
import {
    MultisigConfig,
    sendCreateOrder
} from '@tonkeeper/core/dist/service/multisig/multisigService';
import { notifyError } from '../../../components/transfer/common';
import { useTranslation } from '../../translation';
import { MultisigOrderLifetimeMinutes } from '../../../libs/multisig';
import { getServerTime } from '@tonkeeper/core/dist/service/transfer/common';

export function useSendChangeMultisigConfig(
    newConfig: Omit<MultisigConfig, 'allowArbitrarySeqno'>,
    ttlMinutes: MultisigOrderLifetimeMinutes | undefined
) {
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
            const timestamp = await getServerTime(api);
            const multisig = await multisigInfoPromise;
            if (!multisig) {
                throw new Error('Multisig not found');
            }

            const signer = await getSigner(sdk, signerAccount.id, checkTouchId).catch(() => null);
            if (signer === null || signer.type !== 'cell') {
                throw new Error('Signer not found');
            }

            if (!ttlMinutes) {
                throw new Error('Invalid ttl minutes');
            }

            await sendCreateOrder({
                api,
                multisig,
                hostWallet: signerWallet,
                signer,
                order: {
                    actions: [
                        {
                            type: 'update',
                            ...newConfig
                        }
                    ],
                    validUntilSeconds: timestamp + Number(ttlMinutes) * 60
                }
            });

            await invalidateAccountQueries();
            return true;
        } catch (e) {
            await notifyError(client, sdk, t, e);
            throw e;
        }
    });
}
