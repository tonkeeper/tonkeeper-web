import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import {
  SettingsItem,
  SettingsList,
} from '../../components/settings/SettingsList';
import { SubHeader } from '../../components/SubHeader';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useMutateWalletProperty } from '../../state/wallet';

export const DevSettings = React.memo(() => {
  const { t } = useTranslation();

  const wallet = useWalletContext();
  const { mutate } = useMutateWalletProperty();

  const items = useMemo<SettingsItem[]>(() => {
    const network = wallet.network ?? Network.MAINNET;
    return [
      {
        name: t('settings_network_alert_title'),
        icon: network,
        action: () => mutate({ network: switchNetwork(network) }),
      },
    ];
  }, [t, wallet]);

  return (
    <>
      <SubHeader title="Dev Menu" />
      <InnerBody>
        <SettingsList items={items} />
      </InnerBody>
    </>
  );
});
