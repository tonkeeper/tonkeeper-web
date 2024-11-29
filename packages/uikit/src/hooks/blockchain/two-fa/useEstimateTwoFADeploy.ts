import { useQuery } from '@tanstack/react-query';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { EXTERNAL_SENDER_CHOICE, useGetEstimationSender } from '../useSender';
import { useTonRawTransactionService } from '../useBlockchainService';
import { useNotifyErrorHandle } from '../../useNotification';
import { DefaultRefetchInterval } from '../../../state/tonendpoint';
import { TwoFAEncoder } from '@tonkeeper/core/dist/service/ton-blockchain/encoder/2fa-encoder';
import { useActiveAccount } from '../../../state/wallet';
import { useTwoFAServiceConfig, useTwoFAWalletConfig } from '../../../state/two-fa';
import { isStandardTonWallet } from '@tonkeeper/core/dist/entries/wallet';
import { useAppContext } from '../../appContext';

export function useEstimateTwoFADeploy() {
    const getSender = useGetEstimationSender(EXTERNAL_SENDER_CHOICE);
    const rawTransactionService = useTonRawTransactionService();
    const notifyError = useNotifyErrorHandle();
    const account = useActiveAccount();
    const wallet = account.activeTonWallet;
    const { data: twoFAWalletConfig } = useTwoFAWalletConfig();
    const { servicePubKey } = useTwoFAServiceConfig();
    const { api } = useAppContext();

    return useQuery<TonEstimation, Error>(
        ['estimate-deploy-2fa-plugin', wallet],
        async () => {
            try {
                if (!isStandardTonWallet(wallet)) {
                    throw new Error('Cant deploy two fa plugin using this wallet');
                }

                const tx = await new TwoFAEncoder(api, wallet.rawAddress).encodeInstallForDevice({
                    seedPubKey: BigInt('0x' + wallet.publicKey),
                    servicePubKey,
                    devicePubKey: BigInt(twoFAWalletConfig!.deviceKey!.publicKey)
                });
                return await rawTransactionService.estimate(await getSender!(), tx);
            } catch (e) {
                await notifyError(e);
                throw e;
            }
        },
        {
            refetchInterval: DefaultRefetchInterval,
            refetchOnMount: 'always',
            enabled: !!getSender && !!twoFAWalletConfig
        }
    );
}
