import { Network, switchNetwork } from '@tonkeeper/core/dist/entries/network';
import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useActiveWallet } from '../../state/wallet';
import { useDevSettings, useMutateDevSettings } from '../../state/dev';
import { useAppSdk } from '../../hooks/appSdk';
import { CloseIcon, SpinnerIcon } from '../../components/Icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { Label1 } from '../../components/Text';
import { Switch } from '../../components/fields/Switch';
import { Badge } from '../../components/shared';
import styled from 'styled-components';

const CookieSettings = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    const { mutate, isLoading } = useMutation(async () => {
        await sdk.cookie?.cleanUp();
        await client.invalidateQueries();
    });

    const items = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: 'Clean All Cookies',
                icon: isLoading ? <SpinnerIcon /> : <CloseIcon />,
                action: () => mutate()
            }
        ];
    }, [mutate, isLoading]);

    if (!sdk.cookie) {
        return null;
    }

    return <SettingsList items={items} />;
};

const TextAndBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const EnableTwoFASettings = () => {
    const { mutate: mutateSettings } = useMutateDevSettings();
    const { data: devSettings } = useDevSettings();

    return (
        <ListBlock>
            <ListItem hover={false}>
                <ListItemPayload>
                    <TextAndBadge>
                        <Label1>Enable 2FA</Label1>
                        <Badge color="textSecondary">Experimental</Badge>
                    </TextAndBadge>
                    <Switch
                        disabled={!devSettings}
                        checked={!!devSettings?.twoFAEnabled}
                        onChange={checked => mutateSettings({ twoFAEnabled: checked })}
                    />
                </ListItemPayload>
            </ListItem>
        </ListBlock>
    );
};

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
                <EnableTwoFASettings />
                <CookieSettings />
                {/* TODO: ENABLE TRON */}
                {/* <SettingsList items={items2} /> */}
            </InnerBody>
        </>
    );
});
DevSettings.displayName = 'DevSettings';
