import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deployMultisig, MultisigConfig } from '@tonkeeper/core/dist/service/multisigService';
import { useAppContext } from '../../appContext';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState } from '../../../state/wallet';
import { isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { useCheckTouchId } from '../../../state/password';
import { notifyError } from '../../../components/transfer/common';
import { useTranslation } from '../../translation';
import { anyOfKeysParts } from '../../../libs/queryKey';
import BigNumber from 'bignumber.js';
import { MultisigApi } from '@tonkeeper/core/dist/tonApiV2';

export const useDeployMultisig = (
    params:
        | {
              multisigConfig: MultisigConfig;
              fromWallet: WalletId;
              feeWei: BigNumber;
          }
        | undefined
) => {
    const { api } = useAppContext();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(a => a.allTonWallets.map(w => ({ wallet: w, account: a })));

    const client = useQueryClient();
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    return useMutation<string | undefined, Error>(async () => {
        try {
            if (!params) {
                throw new Error('Unknown error, params are empty');
            }

            const accountAndWallet = wallets.find(w => w.wallet.id === params.fromWallet);
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
                multisigConfig: params.multisigConfig,
                walletState: accountAndWallet.wallet,
                signer,
                feeWei: params.feeWei
            });

            const maxAttempts = 20;
            const awaitIsDeployed = async (attempt = 0): Promise<void> => {
                try {
                    const deployed = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                        accountId: address.toRawString()
                    });

                    if (deployed?.address) {
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }

                if (attempt > maxAttempts) {
                    throw new Error('Contract was not deployed in 20 blocks');
                }

                await new Promise(resolve => setTimeout(resolve, 1500));
                return awaitIsDeployed(attempt + 1);
            };

            // await awaitIsDeployed();

            await client.invalidateQueries(
                anyOfKeysParts(
                    address.toRawString(),
                    accountAndWallet.account.id,
                    accountAndWallet.wallet.id
                )
            );
            return address.toRawString();
        } catch (e) {
            await notifyError(client, sdk, t, e);
            return undefined;
        }
    });
};
