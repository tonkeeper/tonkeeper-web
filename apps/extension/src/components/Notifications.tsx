import { ConnectItem } from '@tonkeeper/core/dist/entries/tonConnect';
import { delay } from '@tonkeeper/core/dist/utils/common';
import { TonConnectNotification } from '@tonkeeper/uikit/dist/components/connect/TonConnectNotification';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { useCallback, useEffect, useState } from 'react';
import { askBackground, sendBackground } from '../event';
import { NotificationData } from '../libs/event';

export const Notifications = () => {
  const [data, setData] = useState<NotificationData | undefined>(undefined);

  const { t } = useTranslation();
  const sdk = useAppSdk();

  const reloadNotification = useCallback(async (wait = true) => {
    setData(undefined);
    if (wait) {
      await delay(300);
    }
    try {
      const item = await askBackground<NotificationData | undefined>().message(
        'getNotification'
      );
      if (item) {
        console.log(item);
        setData(item);
      } else {
        sendBackground.message('closePopUp');
      }
    } catch (e) {
      sendBackground.message('closePopUp');
    }
  }, []);

  useEffect(() => {
    if (window.location.hash === '#/notification') {
      reloadNotification(false);
    }
  }, []);

  return (
    <>
      <TonConnectNotification
        origin={data?.origin}
        params={data?.kind === 'tonConnectRequest' ? data.data : null}
        handleClose={(payload?: ConnectItem[]) => {
          if (!data) return;
          if (payload) {
            sendBackground.message('approveRequest', { id: data.id, payload });
          } else {
            sendBackground.message('rejectRequest', data.id);
          }
          reloadNotification(true);
        }}
      />
    </>
  );
};
