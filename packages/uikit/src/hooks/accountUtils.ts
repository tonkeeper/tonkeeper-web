import { Account, isAccountTonWalletStandard } from '@tonkeeper/core/dist/entries/account';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';
import { useActiveAccount, useActiveApi, useActiveTonNetwork } from '../state/wallet';
import { useTranslation } from './translation';
import { useAppContext } from './appContext';
import { useAppSdk } from './appSdk';
import { useCheckTouchId } from '../state/password';
import { useMutation } from '@tanstack/react-query';
import {
    createTonProofItem,
    tonConnectProofPayload
} from '@tonkeeper/core/dist/service/tonConnect/connectService';
import { walletStateInitFromState } from '@tonkeeper/core/dist/service/wallet/contractService';
import { signTonConnectOver } from '../state/mnemonic';
import { getServerTime } from '@tonkeeper/core/dist/service/ton-blockchain/utils';

export function useAccountLabel(account: Account) {
    const tonWallets = account.allTonWallets;
    const network = useActiveTonNetwork();
    const { t } = useTranslation();

    return tonWallets.length === 1
        ? toShortValue(formatAddress(tonWallets[0].rawAddress, network))
        : tonWallets.length + ' ' + t('wallets');
}

export const useSignTonProof = () => {
    const api = useActiveApi();
    const account = useActiveAccount();
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<
        ReturnType<typeof createTonProofItem>,
        Error,
        { payload: string; origin: string }
    >(async ({ origin, payload }) => {
        if (!isAccountTonWalletStandard(account)) {
            throw new Error('Invalid account type');
        }

        const timestamp = await getServerTime(api);
        const proofPayload = tonConnectProofPayload(
            timestamp,
            origin,
            account.activeTonWallet.rawAddress,
            payload
        );
        const stateInit = walletStateInitFromState(account.activeTonWallet);
        return createTonProofItem(
            await signTonConnectOver({
                sdk,
                accountId: account.id,
                wallet: account.activeTonWallet,
                t,
                checkTouchId
            })(proofPayload.bufferToSign),
            proofPayload,
            stateInit
        );
    });
};
