import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { Signer } from '@tonkeeper/core/dist/entries/signer';
import { Omit } from 'react-beautiful-dnd';
import { notifyError } from '../../components/transfer/common';
import { getSigner } from '../../state/mnemonic';
import { useCheckTouchId } from '../../state/password';
import { useActiveAccount, useInvalidateActiveWalletQueries } from '../../state/wallet';
import { AmplitudeTransactionType, useTransactionAnalytics } from '../amplitude';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import {
    AccountTonWalletStandard,
    isAccountTonWalletStandard
} from '@tonkeeper/core/dist/entries/account';

export type ContractExecutorParams = {
    api: APIConfig;
    account: AccountTonWalletStandard;
    signer: Signer;
    fee: TransferEstimationEvent;
};

export function useExecuteTonContract<Args extends ContractExecutorParams>(
    {
        executor,
        eventName2
    }: {
        executor: (params: Args) => Promise<void>;
        eventName2: AmplitudeTransactionType;
    },
    args: Omit<Args, Exclude<keyof ContractExecutorParams, 'fee'>>
) {
    const { t } = useTranslation();
    const sdk = useAppSdk();
    const { api } = useAppContext();
    const account = useActiveAccount();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { mutateAsync: checkTouchId } = useCheckTouchId();
    const { mutateAsync: invalidateAccountQueries } = useInvalidateActiveWalletQueries();

    return useMutation<boolean, Error>(async () => {
        if (!isAccountTonWalletStandard(account)) {
            return false;
        }
        if (!args.fee) {
            return false;
        }

        const signer = await getSigner(sdk, account.id, checkTouchId).catch(() => null);
        if (signer === null) return false;

        track2(eventName2);
        try {
            await executor({
                api,
                account,
                signer,
                ...args
            } as Args);
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await invalidateAccountQueries();
        await client.invalidateQueries();
        return true;
    });
}
