import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Omit } from 'react-beautiful-dnd';
import { notifyError } from '../../components/transfer/common';
import { getMnemonic } from '../../state/mnemonic';
import { AmplitudeTransactionType, useTransactionAnalytics } from '../amplitude';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export type ContractExecutorParams = {
    api: APIConfig;
    walletState: WalletState;
    mnemonic: string[];
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
    const walletState = useWalletContext();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();

    return useMutation<boolean, Error>(async () => {
        if (!args.fee) {
            return false;
        }

        const mnemonic = await getMnemonic(sdk, walletState.publicKey).catch(() => null);
        if (mnemonic === null) return false;

        track2(eventName2);
        try {
            await executor({
                api,
                walletState,
                mnemonic,
                ...args
            } as Args);
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([walletState.active.rawAddress]);
        await client.invalidateQueries();
        return true;
    });
}
