import { useEffect, useMemo, useState } from 'react';
import { InnerBody } from '../../components/Body';
import {
    ListBlock,
    ListBlockDesktopAdaptive,
    ListItem,
    ListItemElement,
    ListItemPayload
} from '../../components/List';
import { SubHeader } from '../../components/SubHeader';
import { Label1, Label2Class } from '../../components/Text';
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
    useKeychainSecuritySettings
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
import { useAppSdk, useAppTargetEnv } from '../../hooks/appSdk';
import { CreatePasswordNotification } from '../../components/create/CreatePassword';
import { useDisclosure } from '../../hooks/useDisclosure';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';
import { MobileProChangePinNotification } from '../../components/mobile-pro/pin/MobileProChangePin';
import { ChevronRightIcon } from '../../components/Icon';
import { useSearchParams } from '../../hooks/router/useSearchParams';

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
                        <Label1Capitalised>{t('Lock_screen')}</Label1Capitalised>
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

    ${p => p.theme.proDisplayType === 'desktop' && Label2Class}
`;

const TouchIdSwitch = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data: canPrompt } = useCanPromptTouchId();
    const { password, biometry } = useKeychainSecuritySettings();

    const onChange = async (value: boolean) => {
        await sdk.keychain!.securityCheck('password');
        return sdk.keychain!.setBiometry(value);
    };

    if (!canPrompt || !password) {
        return null;
    }

    return (
        <ListBlockDesktopAdaptive>
            <ListItem hover={false}>
                <ListItemPayload>
                    <Label1Capitalised>{t('biometry_default')}</Label1Capitalised>
                    <Switch checked={!!biometry} onChange={onChange} />
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
    const { password } = useKeychainSecuritySettings();

    if (!password) {
        return null;
    }

    return (
        <ListItem hover={false}>
            <ListItemPayload>
                <Label1Capitalised>{t('Lock_screen')}</Label1Capitalised>
                <Switch checked={!!data} onChange={toggleLock} />
            </ListItemPayload>
        </ListItem>
    );
};

const ChevronRightIconStyled = styled(ChevronRightIcon)`
    color: ${props => props.theme.iconTertiary};
`;

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
                    <ListItemPayload $clickable>
                        <Label1Capitalised>{t('security_change_passcode')}</Label1Capitalised>
                        <ChevronRightIconStyled />
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

    const sdk = useAppSdk();
    const { password: keychainPassword } = useKeychainSecuritySettings();
    const { isOpen, onClose, onOpen } = useDisclosure();
    const [searchParams] = useSearchParams();

    const autoOpenSetPassword = searchParams.get('open-password-notification');
    useEffect(() => {
        if (autoOpenSetPassword) {
            onOpen();
        }
    }, [autoOpenSetPassword]);

    const onResetPassword = async () => {
        await sdk.keychain?.securityCheck();
        await sdk.keychain?.resetSecuritySettings();
    };

    return (
        <>
            <ListBlockDesktopAdaptive>
                <ListItem hover={false} onClick={onOpen}>
                    <ListItemPayload $clickable>
                        <Label1Capitalised>
                            {keychainPassword ? t('Change_password') : t('set_up_password')}
                        </Label1Capitalised>
                        <ChevronRightIconStyled />
                    </ListItemPayload>
                </ListItem>
                <LockSwitchAdditionalSecurityPassword />
                {keychainPassword && (
                    <ListItem hover={false} onClick={onResetPassword}>
                        <ListItemPayload $clickable>
                            <Label1Capitalised>{t('reset_secutiry_settings')}</Label1Capitalised>
                            <ChevronRightIconStyled />
                        </ListItemPayload>
                    </ListItem>
                )}
            </ListBlockDesktopAdaptive>
            {keychainPassword ? (
                <ChangePasswordNotification isOpen={isOpen} handleClose={onClose} />
            ) : (
                <CreatePasswordNotification
                    isOpen={isOpen}
                    handleClose={password => {
                        if (password) {
                            sdk.keychain!.updatePassword(password);
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

    if (isLedger || isKeystone || isReadOnly) {
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
