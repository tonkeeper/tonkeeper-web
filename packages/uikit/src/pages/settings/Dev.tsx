import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet, useMutateWalletProperty } from '../../state/wallet';
import { useDevSettings, useMutateDevSettings } from '../../state/dev';

export const DevSettings = React.memo(() => {
    const { t } = useTranslation();

    const wallet = useActiveWallet();
    const { mutate } = useMutateWalletProperty(true);
    const { mutate: mutateDevSettings } = useMutateDevSettings();
    const { data: devSettings } = useDevSettings();

    const items = useMemo<SettingsItem[]>(() => {
        const network = wallet.network ?? Network.MAINNET;
        return [
            {
                name: t('settings_network_alert_title'),
                icon: network === Network.MAINNET ? 'Mainnet' : 'Testnet',
                action: () => mutate({ network: switchNetwork(network) })
            },
            {
                name: t('Enable wallet V5'),
                icon: devSettings?.enableV5 ? 'Enabled' : 'Disabled',
                action: () => mutateDevSettings({ enableV5: !devSettings?.enableV5 })
            }
        ];
    }, [t, wallet, devSettings]);

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <SettingsList items={items} />
                {/* TODO: ENABLE TRON */}
                {/* <SettingsList items={items2} /> */}
            </InnerBody>
        </>
    );
});
DevSettings.displayName = 'DevSettings';
