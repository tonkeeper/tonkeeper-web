import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useCleanUpTronStore } from '../../state/tron';
import { useMutateWalletProperty } from '../../state/wallet';

export const DevSettings = React.memo(() => {
    const { t } = useTranslation();

    const wallet = useWalletContext();
    const { mutate } = useMutateWalletProperty(true);
    const { mutate: mutateTron } = useCleanUpTronStore();

    const items = useMemo<SettingsItem[]>(() => {
        const network = wallet.network ?? Network.MAINNET;
        return [
            {
                name: t('settings_network_alert_title'),
                icon: network === Network.MAINNET ? 'Mainnet' : 'Testnet',
                action: () => mutate({ network: switchNetwork(network) })
            }
        ];
    }, [t, wallet]);

    const items2 = useMemo<SettingsItem[]>(() => {
        console.log(wallet.tron);
        return [
            {
                name: t('reset_tron_cache'),
                icon: wallet.tron ? 'Active' : 'Inactive',
                action: () => mutateTron()
            }
        ];
    }, [t, wallet, mutateTron]);

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <SettingsList items={items} />
                <SettingsList items={items2} />
            </InnerBody>
        </>
    );
});
DevSettings.displayName = 'DevSettings';
