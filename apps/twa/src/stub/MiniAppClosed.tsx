import { useQueryClient } from '@tanstack/react-query';
import {
    Account,
    AccountSecret,
    isMnemonicAndPassword
} from '@tonkeeper/core/dist/entries/account';
import {
    AnalyticsEventTwaSunsetDownloadClick,
    AnalyticsEventTwaSunsetOpen
} from '@tonkeeper/core/dist/analytics';
import { accountsStorage } from '@tonkeeper/core/dist/service/accountsStorage';
import { ListBlock, ListItem, ListItemPayload } from '@tonkeeper/uikit/dist/components/List';
import { Body2, H2, Label2 } from '@tonkeeper/uikit/dist/components/Text';
import { Button } from '@tonkeeper/uikit/dist/components/fields/Button';
import { ChevronRightIcon } from '@tonkeeper/uikit/dist/components/Icon';
import { WalletEmoji } from '@tonkeeper/uikit/dist/components/shared/emoji/WalletEmoji';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { useAnalyticsTrack } from '@tonkeeper/uikit/dist/hooks/analytics';
import { useAccountLabel } from '@tonkeeper/uikit/dist/hooks/accountUtils';
import { useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import { QueryKey } from '@tonkeeper/uikit/dist/libs/queryKey';
import { useAccountsStateQuery } from '@tonkeeper/uikit/dist/state/wallet';
import { FC, useCallback, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { TwaAppSdk } from '../libs/appSdk';
import { useHandleBackButton } from '../libs/twaHooks';
import { RecoveryPasswordSheet } from './RecoveryPasswordSheet';
import { RecoveryPhrase } from './RecoveryPhrase';
import { SignOutSheet } from './SignOutSheet';

const APP_STORE_URL = 'https://apps.apple.com/app/tonkeeper/id1587742107';
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.ton_keeper';
const DESKTOP_APP_URL = 'https://tonkeeper.com/pro';

const Root = styled.div`
    display: flex;
    flex-direction: column;
    height: var(--app-height, 100%);
    box-sizing: border-box;
    padding: 16px;
`;

// Fills the space between the top of the screen and the pinned download button.
// `justify-content: center` keeps the header + list group centered when it fits;
// once the list outgrows the available space it shrinks and scrolls internally.
const Middle = styled.div`
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
`;

const Header = styled.div`
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 24px 0;
`;

const IconWrapper = styled.div`
    color: ${p => p.theme.accentBlue};
    margin-bottom: 16px;
`;

const Title = styled(H2)`
    text-align: center;
    margin: 0;
`;

const Subtitle = styled(Body2)`
    display: block;
    text-align: center;
    color: ${p => p.theme.textSecondary};
    text-wrap: balance;
    padding: 0 32px;
`;

// The only scrollable element: the wallet list. The rounded ListBlock clips its
// rows, and the scrollbar is hidden so the list edge stays clean.
const Accounts = styled(ListBlock)`
    width: 100%;
    margin-top: 16px;
    flex-shrink: 1;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
        display: none;
    }
`;

const Row = styled(ListItemPayload)`
    align-items: center;
    gap: 12px;
`;

const RowText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    flex-grow: 1;
`;

const Address = styled(Body2)`
    color: ${p => p.theme.textSecondary};
`;

const Chevron = styled(ChevronRightIcon)`
    color: ${p => p.theme.iconTertiary};
    flex-shrink: 0;
`;

const Bottom = styled.div`
    padding-top: 16px;
`;

const WarningTriangle = () => (
    <svg width="84" height="96" viewBox="0 0 84 96" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M31.9806 16.3996C36.6295 8.56242 47.9734 8.56232 52.6222 16.3996L74.8527 53.8781C79.5975 61.8772 73.8328 72 64.5324 72.0002H20.0705C10.77 72.0002 5.00451 61.8772 9.7492 53.8781L31.9806 16.3996ZM42.0002 54.0002C39.791 54.0002 38.0002 55.791 38.0002 58.0002C38.0003 60.2092 39.7911 62.0002 42.0002 62.0002C44.2092 62.0001 46.0001 60.2092 46.0002 58.0002C46.0002 55.7911 44.2093 54.0002 42.0002 54.0002ZM42.0002 28.0002C39.8211 28.0002 38.0829 29.8194 38.1818 31.9962L38.8644 47.0031C38.9407 48.6797 40.3218 50.0001 42.0002 50.0002C43.6785 50.0001 45.0606 48.6797 45.1369 47.0031L45.8185 31.9962C45.9175 29.8194 44.1792 28.0002 42.0002 28.0002Z"
            fill="#45AEF5"
        />
        <path
            opacity="0.32"
            d="M42 54C44.2091 54 46 55.7909 46 58C46 60.2091 44.2091 62 42 62C39.7909 62 38 60.2091 38 58C38 55.7909 39.7909 54 42 54ZM42 28C44.1791 28 45.9173 29.8192 45.8184 31.9961L45.1367 47.0029C45.0605 48.6796 43.6784 50 42 50C40.3216 50 38.9405 48.6796 38.8643 47.0029L38.1816 31.9961C38.0827 29.8192 39.8209 28 42 28Z"
            fill="#45AEF5"
        />
    </svg>
);

const AccountRow: FC<{ account: Account; onSelect: () => void }> = ({ account, onSelect }) => {
    const label = useAccountLabel(account);
    return (
        <ListItem hover={false} onClick={onSelect}>
            <Row>
                <WalletEmoji emoji={account.emoji} emojiSize="24px" containerSize="28px" />
                <RowText>
                    <Label2>{account.name}</Label2>
                    <Address>{label}</Address>
                </RowText>
                <Chevron />
            </Row>
        </ListItem>
    );
};

type SunsetPlatform = NonNullable<AnalyticsEventTwaSunsetOpen['telegram_platform']>;
type SunsetDestination = AnalyticsEventTwaSunsetDownloadClick['destination'];

// Collapse Telegram's platform list to the analytics enum: native iOS/Android
// stay as-is, every desktop/web client folds into 'web', anything unknown into
// 'other'.
const toSunsetPlatform = (platform: string): SunsetPlatform => {
    switch (platform) {
        case 'ios':
        case 'android':
        case 'android_x':
            return platform;
        case 'macos':
        case 'tdesktop':
        case 'weba':
        case 'webk':
        case 'web':
            return 'web';
        default:
            return 'other';
    }
};

const DownloadButton: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t } = useTranslation();
    const track = useAnalyticsTrack();
    const platform = sdk.launchParams.platform;
    const {
        labelKey,
        url,
        destination
    }: { labelKey: string; url: string; destination: SunsetDestination } =
        platform === 'ios'
            ? { labelKey: 'twa_download_ios', url: APP_STORE_URL, destination: 'app_store' }
            : platform === 'android' || platform === 'android_x'
            ? { labelKey: 'twa_download_android', url: GOOGLE_PLAY_URL, destination: 'google_play' }
            : { labelKey: 'twa_download_desktop', url: DESKTOP_APP_URL, destination: 'web' };

    const onClick = () => {
        track({ eventName: 'twa_sunset_download_click', destination });
        sdk.openPage(url);
    };

    return (
        <Button primary fullWidth onClick={onClick}>
            {t(labelKey)}
        </Button>
    );
};

export const MiniAppClosed: FC<{ sdk: TwaAppSdk }> = ({ sdk }) => {
    const { t } = useTranslation();
    const client = useQueryClient();
    const track = useAnalyticsTrack();
    const { data: accounts } = useAccountsStateQuery();

    // Only accounts with a recoverable secret belong in the list — watch-only,
    // hardware and other non-mnemonic accounts have no recovery phrase to show.
    const recoverableAccounts = (accounts ?? []).filter(isMnemonicAndPassword);

    // Reach metric: fire once per session, after the account list has loaded so
    // has_wallets / wallets_count reflect the real state rather than the empty
    // pre-load list.
    const openTracked = useRef(false);
    useEffect(() => {
        if (accounts === undefined || openTracked.current) return;
        openTracked.current = true;
        track({
            eventName: 'twa_sunset_open',
            telegram_platform: toSunsetPlatform(sdk.launchParams.platform),
            has_wallets: recoverableAccounts.length > 0,
            wallets_count: recoverableAccounts.length
        });
    }, [accounts, recoverableAccounts.length, sdk, track]);

    const [passwordAccount, setPasswordAccount] = useState<Account | null>(null);
    const [recovery, setRecovery] = useState<{ account: Account; secret: AccountSecret } | null>(
        null
    );
    const [signOutAccount, setSignOutAccount] = useState<Account | null>(null);

    const onBack = useCallback(() => {
        if (signOutAccount) {
            setSignOutAccount(null);
        } else if (passwordAccount) {
            setPasswordAccount(null);
        } else if (recovery) {
            setRecovery(null);
        } else {
            sdk.miniApp.close();
        }
    }, [signOutAccount, passwordAccount, recovery, sdk]);

    // Drop back to the initial list whenever the mini app is backgrounded (the
    // user switches chats/windows or the OS takes an app-switcher snapshot), so
    // a revealed recovery phrase or a typed password is never left on screen for
    // someone returning to the app or peeking at the task switcher. Resetting on
    // `hidden` (not on return) also keeps the phrase out of that snapshot.
    useEffect(() => {
        const onHidden = () => {
            if (document.hidden) {
                setSignOutAccount(null);
                setPasswordAccount(null);
                setRecovery(null);
            }
        };
        document.addEventListener('visibilitychange', onHidden);
        return () => document.removeEventListener('visibilitychange', onHidden);
    }, []);

    // Show Telegram's native back button on every sub-screen (the recovery page
    // and the password / sign-out sheets); on the root list let Telegram show
    // its own close control.
    const showBackButton = recovery !== null || passwordAccount !== null || signOutAccount !== null;
    useHandleBackButton(onBack, showBackButton);

    const onSignOutConfirm = useCallback(async () => {
        if (!signOutAccount) return;
        // Unlike revealing the phrase (pure client-side crypto), signing out has
        // to persist the removal to Telegram CloudStorage. With no connection
        // that write throws; surface a toast instead of failing silently and
        // leaving the account in place.
        try {
            await accountsStorage(sdk.storage).removeAccountFromState(signOutAccount.id);
            await client.invalidateQueries([QueryKey.account]);
            track({ eventName: 'twa_sunset_sign_out' });
            setSignOutAccount(null);
            setRecovery(null);
        } catch (e) {
            sdk.hapticNotification('error');
            sdk.topMessage(t('twa_recovery_no_connection'));
        }
    }, [signOutAccount, sdk, client, track, t]);

    if (recovery) {
        return (
            <>
                <RecoveryPhrase
                    secret={recovery.secret}
                    onSignOut={() => setSignOutAccount(recovery.account)}
                />
                <SignOutSheet
                    account={signOutAccount}
                    onClose={() => setSignOutAccount(null)}
                    onBackUp={() => setSignOutAccount(null)}
                    onConfirm={onSignOutConfirm}
                />
            </>
        );
    }

    const hasWallets = recoverableAccounts.length > 0;

    return (
        <Root>
            <Middle>
                <Header>
                    <IconWrapper>
                        <WarningTriangle />
                    </IconWrapper>
                    <Title>{t('twa_closed_title')}</Title>
                    <Subtitle>
                        {hasWallets ? t('twa_closed_subtitle_wallets') : t('twa_closed_subtitle')}
                    </Subtitle>
                </Header>

                {hasWallets && (
                    <Accounts margin={false}>
                        {recoverableAccounts.map(account => (
                            <AccountRow
                                key={account.id}
                                account={account}
                                onSelect={() => {
                                    track({ eventName: 'twa_sunset_reveal_start' });
                                    setPasswordAccount(account);
                                }}
                            />
                        ))}
                    </Accounts>
                )}
            </Middle>

            <Bottom>
                <DownloadButton sdk={sdk} />
            </Bottom>

            <RecoveryPasswordSheet
                account={passwordAccount}
                onClose={() => setPasswordAccount(null)}
                onUnlocked={(account, secret) => {
                    setPasswordAccount(null);
                    setRecovery({ account, secret });
                }}
            />
        </Root>
    );
};
