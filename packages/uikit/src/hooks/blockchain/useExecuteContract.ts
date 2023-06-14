import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration } from '@tonkeeper/core/dist/tonApiV1';
import { notifyError } from '../../components/transfer/common';
import { getWalletPassword } from '../../state/password';
import { useSendFBAnalyticsEvent } from '../analytics';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export type ContractExecutor = (params: {
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  password: string;
}) => Promise<void>;

export function useExecuteContract(
  executor: ContractExecutor,
  beforeMutation?: () => { exitWith: boolean } | undefined
) {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const walletState = useWalletContext();
  const client = useQueryClient();
  const track = useSendFBAnalyticsEvent();

  return useMutation<boolean, Error>(async () => {
    const shouldExit = beforeMutation?.();
    if (shouldExit) {
      return shouldExit.exitWith;
    }

    const password = await getWalletPassword(sdk, 'confirm').catch(() => null);
    if (password === null) return false;

    track('send_nft');
    try {
      await executor({
        storage: sdk.storage,
        tonApi,
        walletState,
        password,
      });
    } catch (e) {
      await notifyError(client, sdk, t, e);
    }

    await client.invalidateQueries([walletState.active.rawAddress]);
    await client.invalidateQueries();
    return true;
  });
}
