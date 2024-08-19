import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deployMultisig, MultisigConfig } from '@tonkeeper/core/dist/service/multisigService';
import { useAppContext } from '../../appContext';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { useCheckTouchId } from '../../../state/password';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { notifyError } from '../../../components/transfer/common';
import { useTranslation } from '../../translation';
import { anyOfKeysParts } from '../../../libs/queryKey';

export const useDeployMultisig = ({
    multisigConfig,
    fromWallet,
    fee
}: {
    multisigConfig: MultisigConfig;
    fromWallet: WalletId;
    fee: TransferEstimationEvent;
}) => {
    const { api } = useAppContext();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(a => a.allTonWallets.map(w => ({ wallet: w, account: a })));

    const client = useQueryClient();
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    return useMutation<void, Error>(async () => {
        try {
            const accountAndWallet = wallets.find(w => w.wallet.id === fromWallet);
            if (!accountAndWallet) {
                throw new Error('Wallet not found');
            }

            const signer = await getSigner(sdk, accountAndWallet.account.id, checkTouchId).catch(
                () => null
            );
            if (signer === null) {
                throw new Error('Signer not found');
            }

            if (signer.type !== 'cell') {
                throw new Error(`Cannot deploy using signer type: ${signer.type}`);
            }

            const { address } = await deployMultisig({
                api,
                multisigConfig,
                walletState: accountAndWallet.wallet,
                signer,
                fee
            });

            await client.invalidateQueries(
                anyOfKeysParts(
                    address.toRawString(),
                    accountAndWallet.account.id,
                    accountAndWallet.wallet.id
                )
            );
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }
    });
};
