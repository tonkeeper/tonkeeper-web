import { useCallback } from "react";
import SendActionNotification from "@tonkeeper/uikit/dist/components/transfer/SendNotifications";
import ReceiveNotification from "@tonkeeper/uikit/dist/components/home/ReceiveNotification";
import NftNotification from "@tonkeeper/uikit/dist/components/nft/NftNotification";
import SendNftNotification from "@tonkeeper/uikit/dist/components/transfer/nft/SendNftNotification";
import {
  AddFavoriteNotification,
  EditFavoriteNotification
} from "@tonkeeper/uikit/dist/components/transfer/FavoriteNotification";
import { DeepLinkSubscription } from "../components/DeepLink";
import PairSignerNotification from "@tonkeeper/uikit/dist/components/PairSignerNotification";
import ConnectLedgerNotification from "@tonkeeper/uikit/dist/components/ConnectLedgerNotification";
import PairKeystoneNotification from "@tonkeeper/uikit/dist/components/PairKeystoneNotification";
import { useRecommendations } from "@tonkeeper/uikit/dist/hooks/browser/useRecommendations";
import { useCanPromptTouchId } from "@tonkeeper/uikit/dist/state/password";
import { TonConnectSubscription } from "../components/TonConnectSubscription";
import { PullToRefresh } from "../components/PullToRefresh";
import { useQueryClient } from "@tanstack/react-query";

export const BackgroundElements = () => {
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    const promise1 = queryClient.invalidateQueries();
    const promise2 = new Promise(r => setTimeout(r, 1000));

    await Promise.all([promise1, promise2]);
  }, [queryClient]);

  return (
    <>
      <SendActionNotification />
      <ReceiveNotification />
      <TonConnectSubscription />
      <NftNotification />
      <SendNftNotification />
      <AddFavoriteNotification />
      <EditFavoriteNotification />
      <DeepLinkSubscription />
      <PairSignerNotification />
      <ConnectLedgerNotification />
      <PairKeystoneNotification />
      <PullToRefresh onRefresh={onRefresh} />
    </>
  );
};

export const usePrefetch = () => {
  useRecommendations();
  useCanPromptTouchId();
};
