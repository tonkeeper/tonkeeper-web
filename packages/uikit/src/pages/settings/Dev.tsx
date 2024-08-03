import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet } from '../../state/wallet';
import { useDevSettings, useMutateDevSettings } from '../../state/dev';

export const DevSettings = React.memo(() => {
    const { t } = useTranslation();

    const wallet = useActiveWallet();
    const { mutate: mutateDevSettings } = useMutateDevSettings();
    const { data: devSettings } = useDevSettings();

    const items = useMemo<SettingsItem[]>(() => {
        const network = devSettings?.tonNetwork ?? Network.MAINNET;
        return [
            {
                name: t('settings_network_alert_title'),
                icon: network === Network.MAINNET ? 'Mainnet' : 'Testnet',
                action: () => mutateDevSettings({ tonNetwork: switchNetwork(network) })
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
