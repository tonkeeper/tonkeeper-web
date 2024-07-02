import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useEnableW5, useEnableW5Mutation } from '../../state/experemental';
import { useActiveWallet, useMutateWalletProperty } from '../../state/wallet';

const SettingsW5 = () => {
    const { experimental } = useAppContext();
    const { data } = useEnableW5();
    const { mutate } = useEnableW5Mutation();

    const items = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: 'Experimental W5',
                icon: data ? 'Active' : 'Inactive',
                action: () => mutate()
            }
        ];
    }, [data, mutate]);

    if (data === undefined || experimental !== true) return null;

    return <SettingsList items={items} />;
};

export const DevSettings = React.memo(() => {
    const { t } = useTranslation();

    const wallet = useActiveWallet();
    const { mutate } = useMutateWalletProperty(true);

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

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <SettingsList items={items} />
                {/* TODO: ENABLE TRON */}
                {/* <SettingsList items={items2} /> */}
                <SettingsW5 />
            </InnerBody>
        </>
    );
});
DevSettings.displayName = 'DevSettings';
