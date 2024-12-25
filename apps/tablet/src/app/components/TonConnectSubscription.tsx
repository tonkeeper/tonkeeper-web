import { useResponseSendMutation } from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { TonTransactionNotification } from '@tonkeeper/uikit/dist/components/connect/TonTransactionNotification';
import { useSendNotificationAnalytics } from '@tonkeeper/uikit/dist/hooks/amplitude';
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  tonConnectAppManuallyDisconnected$, useAppTonConnectConnections,
  useDisconnectTonConnectApp
} from "@tonkeeper/uikit/dist/state/tonConnect";
import { SendTransactionAppRequest } from '@tonkeeper/core/dist/entries/tonConnect';
import {
  subscribeToTonConnectDisconnect,
  subscribeToTonConnectSendTransaction,
  tonConnectSSE
} from "../../libs/tonConnect";
import { useActiveWallet } from "@tonkeeper/uikit/dist/state/wallet";
import { useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@tonkeeper/uikit/dist/libs/queryKey";

export const TonConnectSubscription = () => {
  const [request, setRequest] = useState<SendTransactionAppRequest | undefined>(undefined);

  const { mutateAsync: responseSendAsync } = useResponseSendMutation();
  const { mutate: disconnect } = useDisconnectTonConnectApp({ skipEmit: true });
  const { data: appConnections } = useAppTonConnectConnections();
  const wallet = useActiveWallet();
  const activeWalletConnections = useMemo(() => appConnections?.find(c => c.wallet.id === wallet.id)?.connections, [appConnections, wallet.id]);
  const queryClient = useQueryClient();

  useSendNotificationAnalytics(request?.connection?.manifest);

  const onTransaction = useCallback(async (request: SendTransactionAppRequest) => {
    await queryClient.invalidateQueries([QueryKey.account]);
    setRequest(request);
  }, [setRequest]);

  useEffect(() => subscribeToTonConnectSendTransaction(onTransaction), [onTransaction]);

  useEffect(() => subscribeToTonConnectDisconnect(disconnect), [disconnect]);

  useEffect(() => {
    return tonConnectAppManuallyDisconnected$.subscribe(value => {
      if (value) {
        tonConnectSSE.sendDisconnect(value);
      }
    });
  }, []);

  useEffect(() => {
    if (activeWalletConnections && JSON.stringify(activeWalletConnections) !== JSON.stringify(tonConnectSSE.currentConnections)) {
      tonConnectSSE.reconnect();
    }
  }, [activeWalletConnections]);

  const handleClose = useCallback(
    async (boc?: string) => {
      if (!request) return;
      try {
        await responseSendAsync({ request, boc });
      } finally {
        setRequest(undefined);
      }
    },
    [request, responseSendAsync, setRequest]
  );

  return (
    <TonTransactionNotification params={request?.payload ?? null} handleClose={handleClose} />
  );
};
