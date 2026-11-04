import { FC, ReactNode, useEffect } from 'react';
import { assertUnreachable } from '@tonkeeper/core/dist/utils/types';

import { useAppSdk, useAppTargetEnv } from '../../../../hooks/appSdk';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useSearchParams } from '../../../../hooks/router/useSearchParams';
import { useTranslation } from '../../../../hooks/translation';
import { useDisclosure } from '../../../../hooks/useDisclosure';
import { MultichainRoute } from '../../../../libs/routes';
import {
    useCanPromptTouchId,
    useKeychainSecuritySettings,
    useLookScreen,
    useMutateLookScreen
} from '../../../../state/password';
import { useIsPasswordSet } from '../../../../state/wallet';
import { useMutateSafeMode, useSafeModeState } from '../../../../state/multichain/useSafeMode';
import { Switch } from '../../../../primitives/Switch';
import IcLock28 from '../../../../icons/components/IcLock28';
import { ChangePasswordNotification } from '../../../../components/create/ChangePassword';
import { CreatePasswordNotification } from '../../../../components/create/CreatePassword';
import { MobileProChangePinNotification } from '../../../../components/mobile-pro/pin/MobileProChangePin';
import { SettingsListCell, SettingsListGroup } from './SettingsList';
import { SettingsPageLayout } from './SettingsPageLayout';

const Group: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="px-4 pb-4">
        <SettingsListGroup>{children}</SettingsListGroup>
    </div>
);

const LockScreenCell = () => {
    const { t } = useTranslation();
    const { data: lockEnabled } = useLookScreen();
    const { mutate: toggleLock } = useMutateLookScreen();

    return (
        <SettingsListCell
            title={t('Lock_screen')}
            rightNode={<Switch checked={!!lockEnabled} onChange={toggleLock} />}
        />
    );
};

/**
 * Lock toggle for profiles secured by the app password (accounts with
 * `auth.kind === 'password'`). On keychain platforms the toggle instead
 * lives inside the password group below, gated by the keychain password.
 */
const PasswordLockGroup = () => {
    const isPasswordSet = useIsPasswordSet();

    if (!isPasswordSet) {
        return null;
    }

    return (
        <Group>
            <LockScreenCell />
        </Group>
    );
};

const BiometryGroup = () => {
    const sdk = useAppSdk();
    const { t } = useTranslation();
    const { data: canPrompt } = useCanPromptTouchId();
    const { password, biometry } = useKeychainSecuritySettings();

    if (!canPrompt || !password) {
        return null;
    }

    const onChange = async (value: boolean) => {
        await sdk.keychain!.securityCheck('password');
        return sdk.keychain!.setBiometry(value);
    };

    return (
        <Group>
            <SettingsListCell
                title={<span className="capitalize">{t('biometry_default')}</span>}
                rightNode={<Switch checked={!!biometry} onChange={onChange} />}
            />
        </Group>
    );
};

/**
 * Safe mode hides unverified assets across the wallet. Turning it off is
 * temporary — it re-enables itself after 24 hours — and while the window
 * runs a footnote offers turning it off for good, mirroring Android's
 * security screen.
 */
const SafeModeGroup = () => {
    const { t } = useTranslation();
    const { data: safeMode } = useSafeModeState();
    const { mutate: setSafeMode } = useMutateSafeMode();

    if (!safeMode) {
        return null;
    }

    return (
        <div className="px-4 pb-4">
            <SettingsListGroup>
                <SettingsListCell
                    title={t('safe_mode')}
                    rightNode={
                        <Switch
                            checked={safeMode.enabled}
                            onChange={checked =>
                                setSafeMode(
                                    checked
                                        ? { type: 'enabled' }
                                        : { type: 'disabled', disabledAtMs: Date.now() }
                                )
                            }
                        />
                    }
                />
            </SettingsListGroup>
            {safeMode.temporarilyDisabled && (
                <div className="px-4 pt-2 text-body2 text-textSecondary">
                    {t('safe_mode_disabled_temporarily')}{' '}
                    <button
                        type="button"
                        className="text-textAccent"
                        onClick={() => setSafeMode({ type: 'disabled-permanently' })}
                    >
                        {t('safe_mode_disable_permanently')}
                    </button>
                </div>
            )}
            <div className="px-4 pt-2 text-body2 text-textSecondary">
                {t('safe_mode_description')}
            </div>
        </div>
    );
};

const WebPasswordGroup = () => {
    const { t } = useTranslation();
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <>
            <Group>
                <SettingsListCell
                    title={t('Change_password')}
                    rightIcon={<IcLock28 />}
                    onClick={onOpen}
                />
            </Group>
            <ChangePasswordNotification isOpen={isOpen} handleClose={onClose} />
        </>
    );
};

/**
 * Pin is always set on mobile pro, so the row never falls back to the
 * "set up password" state.
 */
const MobileProPasswordGroup = () => {
    const { t } = useTranslation();
    const { password } = useKeychainSecuritySettings();
    const { isOpen, onClose, onOpen } = useDisclosure();

    return (
        <>
            <Group>
                <SettingsListCell title={t('security_change_passcode')} chevron onClick={onOpen} />
                {!!password && <LockScreenCell />}
            </Group>
            <MobileProChangePinNotification isOpen={isOpen} onClose={onClose} />
        </>
    );
};

/**
 * Keychain password can be not set yet on desktop / tablet, so the first
 * row switches between "set up" and "change".
 */
const DesktopAndTabletPasswordGroup = () => {
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
    }, [autoOpenSetPassword, onOpen]);

    const onResetPassword = async () => {
        await sdk.keychain?.securityCheck();
        await sdk.keychain?.resetSecuritySettings();
    };

    return (
        <>
            <Group>
                <SettingsListCell
                    title={keychainPassword ? t('Change_password') : t('set_up_password')}
                    chevron
                    onClick={onOpen}
                />
                {!!keychainPassword && <LockScreenCell />}
                {!!keychainPassword && (
                    <SettingsListCell
                        title={t('reset_secutiry_settings')}
                        chevron
                        onClick={onResetPassword}
                    />
                )}
            </Group>
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

const PasswordSection = () => {
    const env = useAppTargetEnv();

    switch (env) {
        case 'desktop':
        case 'tablet':
            return <DesktopAndTabletPasswordGroup />;
        case 'mobile':
            return <MobileProPasswordGroup />;
        case 'extension':
        case 'web':
        case 'twa':
            return <WebPasswordGroup />;
        default:
            return assertUnreachable(env);
    }
};

/**
 * Security settings of the multichain shell. Which rows appear depends on
 * how the platform stores the unlock secret: password-auth profiles get
 * the plain lock toggle, keychain platforms (desktop / tablet / mobile
 * pro) additionally get biometry and reset rows driven by the keychain
 * security state.
 */
export const SettingsSecurityPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <SettingsPageLayout
            compact={compact}
            title={t('settings_security')}
            onBack={() => navigate(MultichainRoute.settings)}
        >
            <PasswordLockGroup />
            <BiometryGroup />
            <SafeModeGroup />
            <PasswordSection />
        </SettingsPageLayout>
    );
};
