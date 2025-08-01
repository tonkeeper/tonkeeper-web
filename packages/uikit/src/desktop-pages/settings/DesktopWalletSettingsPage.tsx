import { TonWalletStandard, walletVersionText } from '@tonkeeper/core/dist/entries/wallet';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import {
    AppsIcon,
    CoinsIcon,
    ExitIcon,
    KeyIcon,
    LockIcon,
    NotificationOutlineIcon, PinIconOutline,
    SaleBadgeIcon,
    SwitchIcon,
    TrashBinIcon,
    UnpinIconOutline
} from "../../components/Icon";
import { Body3, Label2, Label2Class } from '../../components/Text';
import {
    DesktopViewDivider,
    DesktopViewHeader,
    DesktopViewHeaderContent,
    DesktopViewPageLayout
} from '../../components/desktop/DesktopViewLayout';
import { WalletEmoji } from '../../components/shared/emoji/WalletEmoji';
import { useTranslation } from '../../hooks/translation';
import { AppRoute, WalletSettingsRoute } from '../../libs/routes';
import {
    getAccountWalletNameAndEmoji,
    useActiveAccount,
    useHideMAMAccountDerivation,
    useIsActiveWalletWatchOnly,
    useMutateActiveAccount
} from '../../state/wallet';
import {
    AccountMAM,
    isAccountVersionEditable,
    AccountTonMultisig
} from '@tonkeeper/core/dist/entries/account';
import { useRenameNotification } from '../../components/modals/RenameNotificationControlled';
import { useRecoveryNotification } from '../../components/modals/RecoveryNotificationControlled';
import { AssetBlockchainBadge, WalletIndexBadge } from '../../components/account/AccountBadge';
import {
    useActiveMultisigAccountHost,
    useIsActiveAccountMultisig,
    useMultisigTogglePinForWallet
} from '../../state/multisig';
import { useDeleteAccountNotification } from '../../components/modals/DeleteAccountNotificationControlled';
import React from 'react';
import { useAppSdk } from '../../hooks/appSdk';
import { useCanViewTwoFA } from '../../state/two-fa';
import { useNavigate } from '../../hooks/router/useNavigate';
import {
    useAutoMarkTronFeatureAsSeen,
    useCanUseTronForActiveWallet,
    useIsTronEnabledForActiveWallet,
    useToggleIsTronEnabledForActiveWallet
} from '../../state/tron/tron';
import { Switch } from '../../components/fields/Switch';
import { hexToRGBA, hover } from '../../libs/css';
import { Badge } from '../../components/shared/Badge';
import { HideOnReview } from '../../components/ios/HideOnReview';
import { ForTargetEnv } from '../../components/shared/TargetEnv';

const SettingsListBlock = styled.div`
    padding: 0.5rem 0;
`;

const SettingsListItem = styled.div`
    padding: 10px 1rem;
    display: flex;
    gap: 12px;
    align-items: center;

    transition: background-color 0.15s ease-in-out;
    cursor: pointer;
    ${hover`
        background-color: ${p => hexToRGBA(p.theme.backgroundContentTint, 0.7)};
    `}

    > svg {
        color: ${p => p.theme.iconSecondary};
        flex-shrink: 0;
    }
`;

const SettingsListText = styled.div`
    display: flex;
    flex-direction: column;
    ${Body3} {
        color: ${p => p.theme.textSecondary};
    }
`;

const LinkStyled = styled(Link)`
    text-decoration: unset;
    color: unset;
`;

const Body3Row = styled(Body3)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const SwitchStyled = styled(Switch)`
    margin-left: auto;
    flex-shrink: 0;
`;

const LabelWithBadge = styled(Label2)`
    display: flex;
    align-items: center;
    gap: 6px;
`;

const SignOutTextContainer = styled.div`
    display: flex;
    align-items: center;

    ${Label2Class};

    > *:nth-child(1) {
        margin-left: 8px;
    }
`;

export const DesktopWalletSettingsPage = () => {
    const { t } = useTranslation();
    const account = useActiveAccount();
    const { onOpen: rename } = useRenameNotification();
    const { onOpen: recovery } = useRecoveryNotification();
    const { mutateAsync: hideDerivation } = useHideMAMAccountDerivation();
    const { onOpen: onDelete } = useDeleteAccountNotification();

    const isReadOnly = useIsActiveWalletWatchOnly();
    const isMultisig = useIsActiveAccountMultisig();

    const canChangeVersion = isAccountVersionEditable(account);

    // check available derivations length to filter and keep only non-legacy added ledger accounts
    const canChangeLedgerIndex =
        account.type === 'ledger' && account.allAvailableDerivations.length > 1;
    const activeWallet = account.activeTonWallet;

    const activeDerivation = account.type === 'mam' ? account.activeDerivation : undefined;
    const navigate = useNavigate();

    const onHide = () => {
        hideDerivation({
            accountId: account.id,
            derivationIndex: (account as AccountMAM).activeDerivationIndex
        }).then(() => navigate(AppRoute.home));
    };

    const canViewTwoFA = useCanViewTwoFA();

    const notificationsAvailable = useAppSdk().notifications !== undefined;

    useAutoMarkTronFeatureAsSeen();
    const canUseTron = useCanUseTronForActiveWallet();
    const isTronEnabled = useIsTronEnabledForActiveWallet();
    const { mutate: onToggleTron } = useToggleIsTronEnabledForActiveWallet();

    const { name: accountName, emoji: accountEmoji } = getAccountWalletNameAndEmoji(account);

    return (
        <DesktopViewPageLayout>
            <DesktopViewHeader borderBottom>
                <DesktopViewHeaderContent title={t('settings_title')} />
            </DesktopViewHeader>
            <SettingsListBlock>
                <SettingsListItem
                    onClick={() =>
                        rename({ accountId: account.id, derivationIndex: activeDerivation?.index })
                    }
                >
                    <WalletEmoji containerSize="16px" emojiSize="16px" emoji={accountEmoji} />
                    <SettingsListText>
                        <Label2>{accountName}</Label2>
                        <Body3>{t('customize')}</Body3>
                    </SettingsListText>
                </SettingsListItem>
            </SettingsListBlock>
            <DesktopViewDivider />
            <SettingsListBlock>
                {(account.type === 'mnemonic' ||
                    account.type === 'testnet' ||
                    account.type === 'sk') && (
                    <SettingsListItem onClick={() => recovery({ accountId: account.id })}>
                        <KeyIcon />
                        <Label2>{t('settings_backup_seed')}</Label2>
                    </SettingsListItem>
                )}
                {account.type === 'mam' && (
                    <SettingsListItem
                        onClick={() =>
                            recovery({ accountId: account.id, walletId: activeWallet.id })
                        }
                    >
                        <KeyIcon />
                        <Label2>{t('settings_backup_wallet')}</Label2>
                    </SettingsListItem>
                )}
                {canViewTwoFA && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.twoFa}>
                        <SettingsListItem>
                            <LockIcon />
                            <SettingsListText>
                                <LabelWithBadge>
                                    <Label2>{t('two_fa_long')}</Label2>
                                    <Badge color="accentOrange">Beta</Badge>
                                </LabelWithBadge>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {canChangeVersion && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.version}>
                        <SettingsListItem>
                            <SwitchIcon />
                            <SettingsListText>
                                <Label2>{t('settings_wallet_version')}</Label2>
                                <Body3>
                                    {walletVersionText((activeWallet as TonWalletStandard).version)}
                                </Body3>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {canChangeLedgerIndex && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.ledgerIndexes}>
                        <SettingsListItem>
                            <SwitchIcon />
                            <SettingsListText>
                                <Label2>{t('settings_ledger_indexes')}</Label2>
                                <Body3># {account.activeDerivationIndex + 1}</Body3>
                            </SettingsListText>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.jettons}>
                    <SettingsListItem>
                        <CoinsIcon />
                        <Label2>{t('settings_jettons_list')}</Label2>
                    </SettingsListItem>
                </LinkStyled>
                <HideOnReview>
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.nft}>
                        <SettingsListItem>
                            <SaleBadgeIcon />
                            <Label2>{t('settings_collectibles_list')}</Label2>
                        </SettingsListItem>
                    </LinkStyled>
                </HideOnReview>
                {notificationsAvailable && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.notification}>
                        <SettingsListItem>
                            <NotificationOutlineIcon />
                            <Label2>{t('settings_notifications')}</Label2>
                        </SettingsListItem>
                    </LinkStyled>
                )}
                {!isReadOnly && (
                    <LinkStyled to={AppRoute.walletSettings + WalletSettingsRoute.connectedApps}>
                        <SettingsListItem>
                            <AppsIcon />
                            <Label2>{t('settings_connected_apps')}</Label2>
                        </SettingsListItem>
                    </LinkStyled>
                )}

                {/*For GPDR purposes: PRO-255*/}
                <ForTargetEnv env={['mobile', 'tablet']}>
                    {account.type !== 'mam' && !isMultisig && (
                        <SettingsListItem onClick={() => onDelete({ accountId: account.id })}>
                            <TrashBinIcon />
                            <Label2>{t('settings_delete_account')}</Label2>
                        </SettingsListItem>
                    )}
                </ForTargetEnv>
            </SettingsListBlock>
            {canUseTron && (
                <>
                    <DesktopViewDivider />
                    <SettingsListBlock>
                        <SettingsListItem onClick={() => onToggleTron()}>
                            <CoinsIcon />
                            <SettingsListText>
                                <LabelWithBadge>
                                    USD₮<AssetBlockchainBadge>TRC20</AssetBlockchainBadge>
                                </LabelWithBadge>
                                <Body3>{t('settings_enable_tron_description')}</Body3>
                            </SettingsListText>
                            <SwitchStyled checked={!!isTronEnabled} />
                        </SettingsListItem>
                    </SettingsListBlock>
                </>
            )}
            <>
                {isMultisig ? (
                    <>
                        <DesktopViewDivider />
                        <SettingsListBlock>
                            <UnpinMultisigSettingsListItem />
                        </SettingsListBlock>
                    </>
                ) : (
                    account.type !== 'mam' && (
                        <>
                            <DesktopViewDivider />
                            <SettingsListBlock>
                                <SettingsListItem
                                    onClick={() => onDelete({ accountId: account.id })}
                                >
                                    <ExitIcon />
                                    <SignOutTextContainer>
                                        {t('settings_reset')}
                                        <WalletEmoji emojiSize="16px" emoji={account.emoji} />
                                        {account.name}
                                    </SignOutTextContainer>
                                </SettingsListItem>
                            </SettingsListBlock>
                        </>
                    )
                )}
                {account.type === 'mam' && account.addedDerivationsIndexes.length > 1 && (
                    <>
                        <DesktopViewDivider />
                        <SettingsListBlock>
                            <SettingsListItem onClick={onHide}>
                                <ExitIcon />
                                <SettingsListText>
                                    <Label2>{t('settings_hide_current_wallet')}</Label2>
                                    <Body3Row>
                                        {account.activeDerivation.name}{' '}
                                        <WalletIndexBadge>
                                            #{account.activeDerivationIndex + 1}
                                        </WalletIndexBadge>
                                    </Body3Row>
                                </SettingsListText>
                            </SettingsListItem>
                        </SettingsListBlock>
                    </>
                )}
            </>
            <DesktopViewDivider />
        </DesktopViewPageLayout>
    );
};

const UnpinMultisigSettingsListItem = () => {
    const { mutateAsync: togglePinForMultisigWallet } = useMultisigTogglePinForWallet();
    const { mutateAsync: mutateActiveAccount } = useMutateActiveAccount();
    const { signerWallet, signerAccount } = useActiveMultisigAccountHost();
    const account = useActiveAccount() as AccountTonMultisig;
    const { t } = useTranslation();
    const navigate = useNavigate();
    const isPinned = account.isPinnedForWallet(signerWallet.id);

    const onUnpin = async () => {
        await togglePinForMultisigWallet({
            multisigId: account.id,
            hostWalletId: signerWallet.id
        });
        await mutateActiveAccount(signerAccount.id);
        navigate(AppRoute.home);
    };

    const onPin = () =>
        togglePinForMultisigWallet({
            multisigId: account.id,
            hostWalletId: signerWallet.id
        });

    if (!isPinned) {
        return (
            <SettingsListItem onClick={onPin}>
                <PinIconOutline />
                <Label2>{t('settings_pin_multisig')}</Label2>
            </SettingsListItem>
        );
    }

    return (
        <SettingsListItem onClick={onUnpin}>
            <UnpinIconOutline />
            <Label2>{t('settings_hide_multisig')}</Label2>
        </SettingsListItem>
    );
};
