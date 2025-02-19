import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppSdk } from '../../hooks/appSdk';
import { CloseIcon, SpinnerIcon, PlusIcon } from '../../components/Icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import { ListBlock, ListItem, ListItemPayload } from '../../components/List';
import { Label1 } from '../../components/Text';
import { Switch } from '../../components/fields/Switch';
import { Badge } from '../../components/shared';
import styled from 'styled-components';
import { useDevSettings, useMutateDevSettings } from '../../state/dev';
import { useActiveConfig } from '../../state/wallet';
import { useDisclosure } from '../../hooks/useDisclosure';
import { Notification } from '../../components/Notification';
import { ImportBySKWallet } from '../import/ImportBySKWallet';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useNavigate } from 'react-router-dom';

const CookieSettings = () => {
    const sdk = useAppSdk();
    const client = useQueryClient();

    const { mutate, isLoading } = useMutation(async () => {
        await sdk.cookie?.cleanUp();
        await sdk.storage.set(AppKey.PRO_AUTH_TOKEN, null);
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

    return null; // TODO force disable 2fa on frontend. SC must be improved

    const config = useActiveConfig();
    if (config.flags?.disable_2fa) {
        return null;
    }

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

const AddAccountBySK = () => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const navigate = useNavigate();

    const items = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: 'Add account with private key',
                icon: <PlusIcon />,
                action: () => onOpen()
            }
        ];
    }, [onOpen]);

    return (
        <>
            <SettingsList items={items} />
            <AddWalletContext.Provider value={{ navigateHome: onClose }}>
                <Notification isOpen={isOpen} handleClose={onClose}>
                    {() => (
                        <ImportBySKWallet
                            afterCompleted={() => {
                                onClose();
                                navigate('/');
                            }}
                        />
                    )}
                </Notification>
            </AddWalletContext.Provider>
        </>
    );
};

export const DevSettings = React.memo(() => {
    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <EnableTwoFASettings />
                <CookieSettings />
                <AddAccountBySK />
            </InnerBody>
        </>
    );
});

DevSettings.displayName = 'DevSettings';
