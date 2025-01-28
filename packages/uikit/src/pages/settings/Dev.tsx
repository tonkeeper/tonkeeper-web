import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppSdk } from '../../hooks/appSdk';
import { CloseIcon, SpinnerIcon } from '../../components/Icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    ListBlock,
    ListBlockDesktopAdaptive,
    ListItem,
    ListItemElement,
    ListItemPayload
} from '../../components/List';
import { Body3, Label1 } from '../../components/Text';
import { Switch } from '../../components/fields/Switch';
import { Badge } from '../../components/shared';
import styled from 'styled-components';
import { useDevSettings, useMutateDevSettings } from '../../state/dev';
import { useActiveConfig } from '../../state/wallet';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { DesktopViewPageLayout } from '../../components/desktop/DesktopViewLayout';

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

const TextColumns = styled.div`
    display: flex;
    flex-direction: column;

    & > ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

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
        <ListBlockDesktopAdaptive>
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
        </ListBlockDesktopAdaptive>
    );
};

const EnableTronSettings = () => {
    const { mutate: mutateSettings } = useMutateDevSettings();
    const { data: devSettings } = useDevSettings();

    const config = useActiveConfig();
    if (config.flags?.disable_tron) {
        return null;
    }

    return (
        <ListBlockDesktopAdaptive>
            <ListItem hover={false}>
                <ListItemPayload>
                    <TextColumns>
                        <TextAndBadge>
                            <Label1>Enable TRON USDT</Label1>
                            <Badge color="accentRed">Experimental</Badge>
                        </TextAndBadge>
                    </TextColumns>
                    <Switch
                        disabled={!devSettings}
                        checked={!!devSettings?.tronEnabled}
                        onChange={checked => mutateSettings({ tronEnabled: checked })}
                    />
                </ListItemPayload>
            </ListItem>
        </ListBlockDesktopAdaptive>
    );
};

const DesktopWrapper = styled(DesktopViewPageLayout)`
    ${ListBlock} {
        margin-bottom: 0;
    }

    ${ListItemElement} {
        min-height: 56px;
    }
`;

export const DevSettings = React.memo(() => {
    const isProDisplay = useIsFullWidthMode();

    if (isProDisplay) {
        return (
            <DesktopWrapper>
                <EnableTwoFASettings />
                <EnableTronSettings />
                <CookieSettings />
            </DesktopWrapper>
        );
    }

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <EnableTwoFASettings />
                <EnableTronSettings />
                <CookieSettings />
            </InnerBody>
        </>
    );
});

DevSettings.displayName = 'DevSettings';
