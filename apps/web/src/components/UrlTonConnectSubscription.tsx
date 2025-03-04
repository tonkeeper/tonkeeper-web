import { ConnectItemReply, DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectionService';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import {
  useResponseConnectionMutation,
  useGetConnectInfo
} from '@tonkeeper/uikit/dist/components/connect/connectHook';
import { useEffect, useState } from 'react';
import { useLocation } from "react-router-dom";
import { useNavigate } from "@tonkeeper/uikit/dist/hooks/router/useNavigate";
import { AppRoute } from "@tonkeeper/uikit/dist/libs/routes";
import { Account } from "@tonkeeper/core/dist/entries/account";
import { WalletId } from "@tonkeeper/core/dist/entries/wallet";

const TON_CONNECT_TRIGGER_PATH = '/ton-connect';

export const UrlTonConnectSubscription = () => {
  const [params, setParams] = useState<TonConnectParams | null>(null);

  const { mutateAsync: parseParams, reset } = useGetConnectInfo();
  const { mutateAsync: responseConnectionAsync, reset: responseReset } =
    useResponseConnectionMutation();


  const handlerClose = async (
    result: {
      replyItems: ConnectItemReply[];
      manifest: DAppManifest;
      account: Account;
      walletId: WalletId;
    } | null
  ) => {
    if (!params) return;
    responseReset();
    try {
      await responseConnectionAsync({ params, result });
    } finally {
      setParams(null);
    }
  };


  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.pathname === TON_CONNECT_TRIGGER_PATH) {
      reset();
      navigate(AppRoute.home, { replace: true });
      parseParams(location.search).then(setParams);
    }
  }, [location, navigate]);

  return (
    <TonConnectNotification
      origin={undefined}
      params={params?.request ?? null}
      handleClose={handlerClose}
    />
  );
};
