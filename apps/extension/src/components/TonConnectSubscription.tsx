import { useEffect } from "react";
import { tonConnectAppManuallyDisconnected$ } from "@tonkeeper/uikit/dist/state/tonConnect";
import { sendBackground } from "../event";

export const TonConnectSubscription = () => {
  useEffect(() => {
    return tonConnectAppManuallyDisconnected$.subscribe(
      value => sendBackground.message(
        'tonConnectDisconnect',
        (Array.isArray(value) ? value :[value]).map(dapp => dapp.webViewUrl).filter(Boolean) as string[]
      )
    );
  }, []);

  return null;
}
