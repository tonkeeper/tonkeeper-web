import { useMutation, useQueryClient } from '@tanstack/react-query';
import { APIConfig } from '@tonkeeper/core/dist/entries/apis';
import { CellSigner } from '@tonkeeper/core/dist/entries/signer';
import { TransferEstimationEvent } from '@tonkeeper/core/dist/entries/send';
import { StandardTonWalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Omit } from 'react-beautiful-dnd';
import { notifyError } from '../../components/transfer/common';
import { getSigner } from '../../state/mnemonic';
import { AmplitudeTransactionType, useTransactionAnalytics } from '../amplitude';
import { useAppContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';
import { TxConfirmationCustomError } from '../../libs/errors/TxConfirmationCustomError';
import { useCheckTouchId } from '../../state/password';
import { useActiveStandardTonWallet } from '../../state/wallet';

export type ContractExecutorParams = {
    api: APIConfig;
    walletState: StandardTonWalletState;
    signer: CellSigner;
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
    const walletState = useActiveStandardTonWallet();
    const client = useQueryClient();
    const track2 = useTransactionAnalytics();
    const { mutateAsync: checkTouchId } = useCheckTouchId();

    return useMutation<boolean, Error>(async () => {
        if (!args.fee) {
            return false;
        }

        const signer = await getSigner(sdk, walletState.publicKey, checkTouchId).catch(() => null);
        if (signer?.type !== 'cell') {
            throw new TxConfirmationCustomError(t('ledger_operation_not_supported'));
        }

        if (signer === null) return false;

        track2(eventName2);
        try {
            await executor({
                api,
                walletState,
                signer,
                ...args
            } as Args);
        } catch (e) {
            await notifyError(client, sdk, t, e);
        }

        await client.invalidateQueries([walletState.id]);
        await client.invalidateQueries();
        return true;
    });
}
