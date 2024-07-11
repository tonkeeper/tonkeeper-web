import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppContext } from '../../hooks/appContext';
import { useWalletContext } from '../../hooks/appContext';
import { useTranslation } from '../../hooks/translation';
import { useEnableW5, useEnableW5Mutation } from '../../state/experemental';
import { useActiveWallet, useMutateWalletProperty } from '../../state/wallet';
import { useMutateWalletProperty } from '../../state/wallet';

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
            </InnerBody>
        </>
    );
});
DevSettings.displayName = 'DevSettings';
