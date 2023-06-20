import { useMutation, useQueryClient } from '@tanstack/react-query';
import { IStorage } from '@tonkeeper/core/dist/Storage';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration, Fee } from '@tonkeeper/core/dist/tonApiV1';
import { Omit } from 'react-beautiful-dnd';
import { notifyError } from '../../components/transfer/common';
import { getWalletPassword } from '../../state/password';
import { AnalyticsEvent, useSendFBAnalyticsEvent } from '../analytics';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export type ContractExecutorParams = {
  storage: IStorage;
  tonApi: Configuration;
  walletState: WalletState;
  password: string;
  fee: Fee;
};

export function useExecuteContract<Args extends ContractExecutorParams>(
  executor: (params: Args) => Promise<void>,
  eventName: AnalyticsEvent
) {
  const { t } = useTranslation();
  const sdk = useAppSdk();
  const { tonApi } = useAppContext();
  const walletState = useWalletContext();
  const client = useQueryClient();
  const track = useSendFBAnalyticsEvent();

  return useMutation(
    async (args: Omit<Args, Exclude<keyof ContractExecutorParams, 'fee'>>) => {
      if (!args.fee) {
        return false;
      }

      const password = await getWalletPassword(sdk, 'confirm').catch(
        () => null
      );
      if (password === null) return false;

      track(eventName);
      try {
        await executor({
          storage: sdk.storage,
          tonApi,
          walletState,
          password,
          ...args,
        } as Args);
      } catch (e) {
        await notifyError(client, sdk, t, e);
      }

      await client.invalidateQueries([walletState.active.rawAddress]);
      await client.invalidateQueries();
      return true;
    }
  );
}
