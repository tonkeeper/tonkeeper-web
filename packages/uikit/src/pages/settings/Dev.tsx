import React, { useMemo } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppSdk } from '../../hooks/appSdk';
import { CloseIcon, SpinnerIcon, PlusIcon } from '../../components/Icon';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AppKey } from '@tonkeeper/core/dist/Keys';
import {
    ListBlock,
    ListBlockDesktopAdaptive,
    ListItem,
    ListItemElement,
    ListItemPayload
} from '../../components/List';
import styled from 'styled-components';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { useDisclosure } from '../../hooks/useDisclosure';
import { useNavigate } from '../../hooks/router/useNavigate';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { ImportBySKWallet } from '../import/ImportBySKWallet';
import { Notification } from '../../components/Notification';
import { useSecurityCheck } from '../../state/password';
import { Label1 } from '../../components/Text';
import { Switch } from '../../components/fields/Switch';
import { useIsOnIosReview, useMutateEnableReviewerMode } from '../../hooks/ios';
import { useAppContext } from '../../hooks/appContext';

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

const AddAccountBySK = () => {
    const { isOpen, onClose, onOpen } = useDisclosure();
    const navigate = useNavigate();
    const { mutateAsync: securityCheck } = useSecurityCheck();

    const items = useMemo<SettingsItem[]>(() => {
        return [
            {
                name: 'Add account with private key',
                icon: <PlusIcon />,
                action: () =>
                    securityCheck()
                        .then(onOpen)
                        .catch(e => console.error(e))
            }
        ];
    }, [onOpen, securityCheck]);

    return (
        <>
            <SettingsList items={items} />
            <AddWalletContext.Provider value={{ navigateHome: onClose }}>
                <Notification isOpen={isOpen} handleClose={onClose} mobileFullScreen>
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

const ReviewerSettings = () => {
    const { mutate, isLoading } = useMutateEnableReviewerMode();
    const isOnReview = useIsOnIosReview();
    const { mainnetConfig } = useAppContext();

    if (mainnetConfig.tablet_enable_additional_security) {
        return null;
    }

    return (
        <ListBlockDesktopAdaptive>
            <ListItem hover={false}>
                <ListItemPayload>
                    <Label1>Enable extra security</Label1>
                    <Switch checked={isOnReview} onChange={mutate} disabled={isLoading} />
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
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title="Dev Menu" />
                    </DesktopViewHeader>
                </ForTargetEnv>
                <CookieSettings />
                <AddAccountBySK />
                <ReviewerSettings />
            </DesktopWrapper>
        );
    }

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <CookieSettings />
                <AddAccountBySK />
            </InnerBody>
        </>
    );
});

DevSettings.displayName = 'DevSettings';
