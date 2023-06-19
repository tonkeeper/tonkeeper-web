import { useMutation, useQueryClient } from '@tanstack/react-query';
import { WalletState } from '@tonkeeper/core/dist/entries/wallet';
import { Configuration, SendApi } from '@tonkeeper/core/dist/tonApiV1';
import { Omit } from 'react-beautiful-dnd';
import { notifyError } from '../../components/transfer/common';
import { useAppContext, useWalletContext } from '../appContext';
import { useAppSdk } from '../appSdk';
import { useTranslation } from '../translation';

export type ContractCallerParams = {
  tonApi: Configuration;
  walletState: WalletState;
};

export function useEstimateFee<Args extends ContractCallerParams>(
  caller: (params: Args) => Promise<string>
) {
  const { tonApi } = useAppContext();
  const walletState = useWalletContext();

  return useMutation(async (args: Omit<Args, 'tonApi' | 'walletState'>) => {
      const boc = await caller({ ...args, walletState, tonApi } as Args);
      const { fee } = await new SendApi(tonApi).estimateTx({
        sendBocRequest: { boc },
      });
      return fee;
  });
}
