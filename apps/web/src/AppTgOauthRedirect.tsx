import { FC, useEffect } from "react";

declare global {
  interface Window {
    tonkeeper?: {
      tgAuth?: {
        sendResult: (base64Result: string) => void
      };
    };
  }
}
export function isInTgAuthInjectionContext() {
   return typeof window.tonkeeper?.tgAuth?.sendResult === 'function';
}

export const AppTgOauthRedirect: FC<{ tgAuthResult: string }> = ({ tgAuthResult }) => {
  useEffect(() => {
    window.tonkeeper!.tgAuth!.sendResult(tgAuthResult);
  }, [tgAuthResult]);

  return (
    <div style={{margin: '20px', fontFamily: "'-apple-system', BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, Tahoma, Verdana, 'sans-serif'"}}>
      <p>Redirecting...</p>
    </div>
  );
}
