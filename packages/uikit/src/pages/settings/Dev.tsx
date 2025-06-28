import React, { useEffect, useMemo, useState } from 'react';
import { InnerBody } from '../../components/Body';
import { SubHeader } from '../../components/SubHeader';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useAppSdk, useIsCapacitorApp } from '../../hooks/appSdk';
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
import { Body3Class, Label1 } from '../../components/Text';
import { useIsOnIosReview, useMutateEnableReviewerMode } from '../../hooks/ios';
import { useAppContext } from '../../hooks/appContext';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { AppRoute, DevSettingsRoute } from '../../libs/routes';
import { Switch } from '../../components/fields/Switch';

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
    const isCapacitor = useIsCapacitorApp();

    if (!isCapacitor || mainnetConfig.tablet_enable_additional_security) {
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

const PromoVisibilitySettings = () => {
    const sdk = useAppSdk();
    const [isPromoVisible, setIsPromoVisible] = useState(false);

    useEffect(() => {
        sdk.storage
            .get<boolean>(AppKey.PRO_HAS_PROMO_BEEN_SHOWN)
            .then(wasShown => setIsPromoVisible(!wasShown))
            .catch(err => {
                console.error('Failed to load visibility state:', err);
                setIsPromoVisible(false);
            });
    }, [sdk.storage]);

    const handleChange = async (isVisible: boolean) => {
        try {
            await sdk.storage.set(AppKey.PRO_HAS_PROMO_BEEN_SHOWN, !isVisible);
            setIsPromoVisible(isVisible);
        } catch (err) {
            console.error('Failed to update visibility:', err);
        }
    };

    return (
        <HideOnReview>
            <ListBlockDesktopAdaptive>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label1>Toggle Promo visibility</Label1>
                        <Switch checked={isPromoVisible} onChange={handleChange} />
                    </ListItemPayload>
                </ListItem>
            </ListBlockDesktopAdaptive>
        </HideOnReview>
    );
};

const LogsSettings = () => {
    const navigate = useNavigate();
    const logger = useAppSdk().logger;
    if (!logger) {
        return null;
    }

    return (
        <HideOnReview>
            <ListBlockDesktopAdaptive>
                <ListItem hover={false} onClick={() => navigate('.' + DevSettingsRoute.logs)}>
                    <ListItemPayload>
                        <Label1>Dev Logs</Label1>
                    </ListItemPayload>
                </ListItem>
            </ListBlockDesktopAdaptive>
        </HideOnReview>
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

const Pre = styled.pre`
    margin: 8px;
    white-space: pre-wrap;
    word-wrap: break-word;
    ${Body3Class};
`;

const DesktopViewPageLayoutStyled = styled(DesktopViewPageLayout)`
    height: 100%;
`;

export const DevSettingsLogs = () => {
    const sdk = useAppSdk();
    const logger = sdk.logger;
    const [logs, setLogs] = useState<string>('');

    const navigate = useNavigate();

    useEffect(() => {
        logger?.read().then(setLogs);
    }, [logger]);

    useEffect(() => {
        if (!logger) {
            navigate(AppRoute.settings, { replace: true });
        }
    }, [logger, navigate]);

    if (!logger) {
        return null;
    }

    const onClear = async () => {
        const confirmed = await sdk.confirm({
            title: 'Delete logs',
            message: 'Are you sure you want to clear all logs?',
            okButtonTitle: 'Delete Logs',
            cancelButtonTitle: 'Cancel'
        });

        if (confirmed) {
            await logger!.clear();
            setLogs('');
        }
    };

    const onCopy = async () => {
        const confirmed = await sdk.confirm({
            title: 'Copy logs',
            message: 'Logs might contain sensitive data. Check it before copying and sharing',
            okButtonTitle: 'Copy Logs Anyway'
        });

        if (confirmed) {
            sdk.copyToClipboard(logs);
        }
    };

    return (
        <DesktopViewPageLayoutStyled>
            <DesktopViewHeader backButton borderBottom>
                <DesktopViewHeaderContent
                    title="Dev Logs"
                    right={
                        <DesktopViewHeaderContent.Right>
                            <DesktopViewHeaderContent.RightItem
                                asDesktopButton
                                closeDropDownOnClick
                                onClick={onClear}
                            >
                                Delete Logs
                            </DesktopViewHeaderContent.RightItem>
                            <DesktopViewHeaderContent.RightItem
                                asDesktopButton
                                closeDropDownOnClick
                                onClick={onCopy}
                            >
                                Copy
                            </DesktopViewHeaderContent.RightItem>
                        </DesktopViewHeaderContent.Right>
                    }
                />
            </DesktopViewHeader>
            <Pre>{logs}</Pre>
        </DesktopViewPageLayoutStyled>
    );
};

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
                <PromoVisibilitySettings />
                <LogsSettings />
            </DesktopWrapper>
        );
    }

    return (
        <>
            <SubHeader title="Dev Menu" />
            <InnerBody>
                <CookieSettings />
                <AddAccountBySK />
                <PromoVisibilitySettings />
            </InnerBody>
        </>
    );
});
