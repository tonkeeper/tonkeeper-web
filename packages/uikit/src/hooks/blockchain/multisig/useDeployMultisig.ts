import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppContext } from '../../appContext';
import { WalletId } from '@tonkeeper/core/dist/entries/wallet';
import { useAccountsState, useActiveApi } from '../../../state/wallet';
import {
    getAccountByWalletById,
    getNetworkByAccount,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';
import { getSigner } from '../../../state/mnemonic';
import { useAppSdk } from '../../appSdk';
import { useCheckTouchId } from '../../../state/password';
import { useTranslation } from '../../translation';
import { anyOfKeysParts } from '../../../libs/queryKey';
import BigNumber from 'bignumber.js';
import { AccountsApi, MultisigApi } from '@tonkeeper/core/dist/tonApiV2';
import { useAccountsStorage } from '../../useStorage';
import { TxConfirmationCustomError } from '../../../libs/errors/TxConfirmationCustomError';
import {
    LedgerMessageSender,
    WalletMessageSender,
    Sender
} from '@tonkeeper/core/dist/service/ton-blockchain/sender';
import { useNotifyErrorHandle } from '../../useNotification';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { Address } from '@ton/core';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { useTonRawTransactionService } from '../useBlockchainService';
import {
    MultisigEncoder,
    MultisigConfig
} from '@tonkeeper/core/dist/service/ton-blockchain/encoder/multisig-encoder';
import { getContextApiByNetwork } from '@tonkeeper/core/dist/service/walletService';

export const useDeployMultisig = (
    params:
        | {
              multisigConfig: MultisigConfig;
              fromWallet: WalletId;
              feeWei: BigNumber;
          }
        | undefined
) => {
    const appContext = useAppContext();
    const wallets = useAccountsState()
        .filter(isAccountTonWalletStandard)
        .flatMap(a => a.allTonWallets.map(w => ({ wallet: w, account: a })));

    const client = useQueryClient();
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const notifyError = useNotifyErrorHandle();
    const rawTransactionService = useTonRawTransactionService();

    return useMutation<string | undefined, Error>(async () => {
        try {
            if (!params) {
                throw new Error('Unknown error, params are empty');
            }

            const accountAndWallet = wallets.find(w => w.wallet.id === params.fromWallet);
            if (!accountAndWallet) {
                throw new Error('Wallet not found');
            }

            const network = getNetworkByAccount(accountAndWallet.account);
            const [api] = getContextApiByNetwork(appContext, network);
            const multisigEncoder = new MultisigEncoder(api, accountAndWallet.wallet.rawAddress);
            const address = multisigEncoder.multisigAddress(params.multisigConfig);

            const alreadyDeployed = await checkIfMultisigExists({
                api,
                address
            });

            if (alreadyDeployed) {
                throw new TxConfirmationCustomError(t('create_multisig_error_already_deployed'));
            }

            const signer = await getSigner(sdk, accountAndWallet.account.id, checkTouchId, {
                walletId: accountAndWallet.wallet.id
            }).catch(() => null);
            if (signer === null) {
                throw new Error('Signer not found');
            }

            const message = await multisigEncoder.encodeCreateMultisig(params.multisigConfig);

            let sender: Sender;
            if (signer.type === 'ledger') {
                sender = new LedgerMessageSender(api, accountAndWallet.wallet, signer, network);
            } else {
                sender = new WalletMessageSender(api, accountAndWallet.wallet, signer, network);
            }

            await rawTransactionService.send(
                sender,
                {
                    extra: new AssetAmount({ asset: TON_ASSET, weiAmount: params.feeWei })
                },
                message
            );

            await client.invalidateQueries(
                anyOfKeysParts(
                    address.toRawString(),
                    accountAndWallet.account.id,
                    accountAndWallet.wallet.id
                )
            );
            return address.toRawString();
        } catch (e) {
            await notifyError(e);
            return undefined;
        }
    });
};

const checkIfMultisigExists = async (options: { api: APIConfig; address: Address }) => {
    const account = await new AccountsApi(options.api.tonApiV2).getAccount({
        accountId: options.address.toRawString()
    });

    return !(account.status === 'nonexist' || account.status === 'uninit');
};

export const useAwaitMultisigIsDeployed = () => {
    const api = useActiveApi();
    const client = useQueryClient();
    const accounts = useAccountsStorage();
    return useMutation<void, Error, { multisigAddress: string; deployerWalletId: WalletId }>(
        async ({ multisigAddress, deployerWalletId }) => {
            const awaitIsDeployed = async (attempt = 0): Promise<void> => {
                try {
                    const deployed = await new MultisigApi(api.tonApiV2).getMultisigAccount({
                        accountId: multisigAddress
                    });

                    if (deployed?.address) {
                        return;
                    }
                } catch (e) {
                    console.error(e);
                }

                await new Promise(resolve => setTimeout(resolve, 1500));
                return awaitIsDeployed(attempt + 1);
            };

            await awaitIsDeployed();
            const deployerAccountId = getAccountByWalletById(
                await accounts.getAccounts(),
                deployerWalletId
            )?.id;

            await client.invalidateQueries(
                anyOfKeysParts(multisigAddress, deployerAccountId, deployerWalletId)
            );
        }
    );
};
