import { Account, isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useActiveAccountQuery, useActiveApi } from '../state/wallet';
import { useTranslation } from './translation';
import { useAppSdk } from './appSdk';
import { useMutation } from '@tanstack/react-query';
import {
    createTonProofItem,
    tonConnectProofPayload
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { walletStateInitFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { signTonConnectOver } from '../state/mnemonic';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';

export function useAccountLabel(account: Account) {
    const tonWallets = account.allTonWallets;
    const { t } = useTranslation();
    const network = account.type === 'testnet' ? Network.TESTNET : Network.MAINNET;

    return tonWallets.length === 1
        ? toShortValue(formatAddress(tonWallets[0].rawAddress, network))
        : tonWallets.length + ' ' + t('wallets');
}

export const useSignTonProof = () => {
    const api = useActiveApi();
    const { data: account } = useActiveAccountQuery();
    const sdk = useAppSdk();
    const { t } = useTranslation();

    return useMutation<
        Omit<ReturnType<typeof createTonProofItem>, 'stateInit'> & {
            stateInit: string;
        },
        Error,
        {
            payload: string;
            origin: string;
            signer?: (b: Buffer) => Promise<Uint8Array | Buffer>;
            wallet?: TonWalletStandard;
        }
    >(async ({ origin, payload, signer, wallet: providedWallet }) => {
        let wallet = providedWallet;
        if (!wallet) {
            if (!account || !isAccountTonWalletStandard(account)) {
                throw new Error('Invalid account type');
            }

            wallet = account.activeTonWallet;
        }

        const timestamp = await getServerTime(api);
        const proofPayload = tonConnectProofPayload(timestamp, origin, wallet.rawAddress, payload);
        const stateInit = walletStateInitFromState(wallet);

        const signingFn =
            signer ??
            signTonConnectOver({
                sdk,
                accountId: account!.id,
                wallet,
                t
            });

        return createTonProofItem(
            await signingFn(proofPayload.bufferToSign),
            proofPayload,
            stateInit
        ) as Omit<ReturnType<typeof createTonProofItem>, 'stateInit'> & { stateInit: string };
    });
};
