import { useMemo, useState } from 'react';
import { InnerBody } from '../../components/Body';
import {
    ListBlock,
    ListBlockDesktopAdaptive,
    ListItem,
    ListItemElement,
    ListItemPayload
} from '../../components/List';
import { SubHeader } from '../../components/SubHeader';
import { Label1 } from '../../components/Text';
import { ChangePasswordNotification } from '../../components/create/ChangePassword';
import { Switch } from '../../components/fields/Switch';
import { KeyIcon, LockIcon } from '../../components/settings/SettingsIcons';
import { SettingsItem, SettingsList } from '../../components/settings/SettingsList';
import { useTranslation } from '../../hooks/translation';
import { useIsFullWidthMode } from '../../hooks/useIsFullWidthMode';
import { AppRoute, SettingsRoute } from '../../libs/routes';
import { useIsActiveWalletKeystone } from '../../state/keystone';
import { useIsActiveWalletLedger } from '../../state/ledger';
import {
    useCanPromptTouchId,
    useLookScreen,
    useMutateLookScreen,
    useMutateSecuritySettings,
    useMutateTouchId,
    useSecuritySettings
} from '../../state/password';
import { useIsActiveWalletWatchOnly, useIsPasswordSet } from '../../state/wallet';
import styled from 'styled-components';
import { useNavigate } from '../../hooks/router/useNavigate';
import {
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { ForTargetEnv } from '../../components/shared/TargetEnv';
import { useAppTargetEnv } from '../../hooks/appSdk';
import { CreatePasswordNotification } from '../../components/create/CreatePassword';
import { useDisclosure } from '../../hooks/useDisclosure';
import { hashAdditionalSecurityPassword } from '../../state/global-preferences';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { MobileProChangePinNotification } from '../../components/mobile-pro/pin/MobileProChangePin';

const LockSwitch = () => {
    const { t } = useTranslation();

    const isPasswordSet = useIsPasswordSet();

    const { data } = useLookScreen();
    const { mutate: toggleLock } = useMutateLookScreen();

    if (isPasswordSet) {
        return (
            <ListBlockDesktopAdaptive>
                <ListItem hover={false}>
                    <ListItemPayload>
                        <Label1>{t('Lock_screen')}</Label1>
                        <Switch checked={!!data} onChange={toggleLock} />
                    </ListItemPayload>
                </ListItem>
            </ListBlockDesktopAdaptive>
        );
    } else {
        return <></>;
    }
};

const Label1Capitalised = styled(Label1)`
    text-transform: capitalize;
`;

const TouchIdSwitch = () => {
    const { t } = useTranslation();
    const { data: canPrompt } = useCanPromptTouchId();
    const securitySettings = useSecuritySettings();

    const { mutate } = useMutateTouchId();

    if (!canPrompt || !securitySettings.additionalPasswordHash) {
        return null;
    }

    return (
        <ListBlockDesktopAdaptive>
            <ListItem hover={false}>
                <ListItemPayload>
                    <Label1Capitalised>{t('biometry_default')}</Label1Capitalised>
                    <Switch checked={!!securitySettings.biometrics} onChange={mutate} />
                </ListItemPayload>
            </ListItem>
        </ListBlockDesktopAdaptive>
    );
};

const Password = () => {
    const env = useAppTargetEnv();

    switch (env) {
        case 'desktop':
        case 'tablet':
            return <DesktopAndTabletProPassword />;
        case 'mobile':
            return <MobileProPassword />;
        case 'extension':
        case 'web':
        case 'twa':
            return <WebPassword />;
        case 'swap_widget_web':
            return null;
        default:
            assertUnreachable(env);
    }
};

const WebPassword = () => {
    const { t } = useTranslation();
    const [isOpen, setOpen] = useState(false);

    const items = useMemo(() => {
        const i: SettingsItem[] = [
            {
                name: t('Change_password'),
                icon: <LockIcon />,
                action: () => setOpen(true)
            }
        ];
        return i;
    }, []);

    return (
        <>
            <SettingsList items={items} />
            <ChangePasswordNotification isOpen={isOpen} handleClose={() => setOpen(false)} />
        </>
    );
};

const LockSwitchAdditionalSecurityPassword = () => {
    const { data } = useLookScreen();
    const { mutate: toggleLock } = useMutateLookScreen();
    const { t } = useTranslation();
    const securitySettings = useSecuritySettings();

    if (!securitySettings.additionalPasswordHash) {
        return null;
    }

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label1>{t('Lock_screen')}</Label1>
                <Switch checked={!!data} onChange={toggleLock} />
            </ListItemPayload>
        </ListItem>
    );
};

/**
 * Pin is always set here
 */
const MobileProPassword = () => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();
    return (
        <>
            <ListBlockDesktopAdaptive>
                <ListItem hover={false} onClick={onOpen}>
                    <ListItemPayload>
                        <Label1Capitalised>{t('security_change_passcode')}</Label1Capitalised>
                        <LockIcon />
                    </ListItemPayload>
                </ListItem>
                <LockSwitchAdditionalSecurityPassword />
            </ListBlockDesktopAdaptive>
            <MobileProChangePinNotification isOpen={isOpen} onClose={onClose} />
        </>
    );
};

/**
 * Password can be not set here
 */
const DesktopAndTabletProPassword = () => {
    const { t } = useTranslation();

    const securitySettings = useSecuritySettings();
    const { mutate } = useMutateSecuritySettings();
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <>
            <ListBlockDesktopAdaptive>
                <ListItem hover={false} onClick={onOpen}>
                    <ListItemPayload>
                        <Label1Capitalised>
                            {securitySettings.additionalPasswordHash
                                ? t('Change_password')
                                : t('set_up_password')}
                        </Label1Capitalised>
                        <LockIcon />
                    </ListItemPayload>
                </ListItem>
                <LockSwitchAdditionalSecurityPassword />
            </ListBlockDesktopAdaptive>
            {securitySettings.additionalPasswordHash ? (
                <ChangePasswordNotification isOpen={isOpen} handleClose={onClose} />
            ) : (
                <CreatePasswordNotification
                    isOpen={isOpen}
                    handleClose={password => {
                        if (password) {
                            hashAdditionalSecurityPassword(password).then(additionalPasswordHash =>
                                mutate({ additionalPasswordHash })
                            );
                        }
                        onClose();
                    }}
                />
            )}
        </>
    );
};

const ShowPhrases = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const isLedger = useIsActiveWalletLedger();
    const isKeystone = useIsActiveWalletKeystone();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isFullWidthMode = useIsFullWidthMode();

    const items = useMemo(() => {
        const i: SettingsItem[] = [
            {
                name: t('settings_backup_seed'),
                icon: <KeyIcon />,
                action: () => navigate(AppRoute.settings + SettingsRoute.recovery)
            }
        ];
        return i;
    }, []);

    if (isLedger || isKeystone || isReadOnly || isFullWidthMode) {
        return <></>;
    }

    return <SettingsList items={items} />;
};

const DesktopWrapper = styled(DesktopViewPageLayout)`
    ${ListBlock} {
        margin-bottom: 0;
    }

    ${ListItemElement} {
        min-height: 56px;
    }
`;

export const SecuritySettings = () => {
    const { t } = useTranslation();
    const isProDisplay = useIsFullWidthMode();

    if (isProDisplay) {
        return (
            <DesktopWrapper>
                <ForTargetEnv env="mobile">
                    <DesktopViewHeader>
                        <DesktopViewHeaderContent title={t('settings_security')} />
                    </DesktopViewHeader>
                </ForTargetEnv>
                <LockSwitch />
                <TouchIdSwitch />
                <Password />
                <ShowPhrases />
            </DesktopWrapper>
        );
    }

    return (
        <>
            <SubHeader title={t('settings_security')} />
            <InnerBody>
                <LockSwitch />
                <TouchIdSwitch />
                <Password />
                <ShowPhrases />
            </InnerBody>
        </>
    );
};

export const useShouldShowSecurityPage = () => {
    const { data: canPromptTouchId } = useCanPromptTouchId();
    const isPasswordSet = useIsPasswordSet();

    const isLedger = useIsActiveWalletLedger();
    const isKeystone = useIsActiveWalletKeystone();
    const isReadOnly = useIsActiveWalletWatchOnly();
    const isFullWidthMode = useIsFullWidthMode();
    const hidePhrasePage = isLedger || isKeystone || isReadOnly || isFullWidthMode;

    return canPromptTouchId || isPasswordSet || !hidePhrasePage;
};
