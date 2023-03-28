import { DAppManifest } from '@tonkeeper/core/dist/entries/tonConnect';
import { TonConnectParams } from '@tonkeeper/core/dist/service/tonConnect/connectService';
import React, { FC, useCallback } from 'react';
import { Notification } from '../Notification';

export interface TonConnectProps {
  params: TonConnectParams;
  manifest: DAppManifest;
}

const ConnectContent: FC<{
  params: TonConnectProps;
  handleClose: () => void;
}> = ({ params, handleClose }) => {
  return <div></div>;
};

export const TonConnectNotification: FC<{
  params: TonConnectProps | null;
  handleClose: () => void;
}> = ({ params, handleClose }) => {
  const Content = useCallback(() => {
    if (!params) return undefined;
    return <ConnectContent params={params} handleClose={handleClose} />;
  }, [params, handleClose]);

  return (
    <Notification isOpen={params != null} handleClose={handleClose} hideButton>
      {Content}
    </Notification>
  );
};
