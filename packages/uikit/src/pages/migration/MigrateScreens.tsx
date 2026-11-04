import { FC, FormEvent, useEffect, useState } from 'react';

import { Account } from '@tonkeeper/core/dist/entries/account';
import { Network } from '@tonkeeper/core/dist/entries/network';
import { walletColorById } from '@tonkeeper/core/dist/entries/walletColor';
import { formatAddress, toShortValue } from '@tonkeeper/core/dist/utils/common';

import { Translation, useTranslation } from '../../hooks/translation';
import { Button } from '../../primitives/Button';
import { Input } from '../../primitives/Input';
import { Loader } from '../../primitives/Loader';
import { AccountKindTag } from '../home/multichain/wallets/accountDisplay';
import { WalletAvatar } from '../home/multichain/wallets/WalletAvatar';
import { Emphasis, MigrationCard, WithEmphasis } from './MigrationCard';

/**
 * One incoming account as the confirm list shows it. Plain data rather than
 * the `Account` itself, so a screen can be rendered from anything that
 * serialises.
 */
export interface MigrateWalletRow {
    id: string;
    name: string;
    emoji: string;
    type: Account['type'];
    label?: string;
    /**
     * The avatar colour the account had where it comes from. This origin has
     * no colour saved for it yet, so without one the avatar would show the
     * fallback colour — not the one the person picked.
     */
    colorHex?: string;
}

const walletLabel = (account: Account, t: Translation): string | undefined => {
    const [wallet, ...rest] = account.allTonWallets;

    if (!wallet) {
        return undefined;
    }

    if (rest.length > 0) {
        return t('domain_move_wallet_count', { count: rest.length + 1 });
    }

    try {
        const network = account.type === 'testnet' ? Network.TESTNET : Network.MAINNET;

        return toShortValue(formatAddress(wallet.rawAddress, network));
    } catch {
        return undefined;
    }
};

export const toMigrateWalletRow = (
    account: Account,
    t: Translation,
    colorId?: string
): MigrateWalletRow => ({
    id: account.id,
    name: account.name,
    emoji: account.emoji,
    type: account.type,
    label: walletLabel(account, t),
    colorHex: walletColorById(colorId)?.hex
});

export const MigrateImporting: FC = () => (
    <div className="flex min-h-[100dvh] items-center justify-center bg-backgroundPage">
        <Loader />
    </div>
);

export type MigrateOfferNotice = 'blocked' | 'closed';

const OFFER_NOTICE = {
    blocked: 'domain_move_offer_blocked',
    closed: 'domain_move_offer_closed'
} as const;

/**
 * When the old origin has reported wallets, the person may have opened this
 * address without knowing the app moved, so the offer says so before asking.
 */
export const MigrateOffer: FC<{
    host: string;
    newHost: string;
    found: boolean;
    notice?: MigrateOfferNotice;
    onContinue: () => void;
    onNotNow: () => void;
}> = ({ host, newHost, found, notice, onContinue, onNotNow }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={
                found ? t('domain_move_offer_moved_title') : t('domain_move_offer_title', { host })
            }
            subtitle={
                // Host names read left to right in every locale, and so must
                // the arrow between them.
                found && (
                    <span dir="ltr">
                        {host} → <Emphasis>{newHost}</Emphasis>
                    </span>
                )
            }
            description={t(
                notice
                    ? OFFER_NOTICE[notice]
                    : found
                    ? 'domain_move_offer_moved_description'
                    : 'domain_move_offer_description'
            )}
            actions={
                <>
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onContinue}>
                        {found
                            ? t('domain_move_move_my_wallets')
                            : t('domain_move_continue_on', { host })}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onNotNow}>
                        {t('domain_move_not_now')}
                    </Button>
                </>
            }
        />
    );
};

export const MigrateWaiting: FC<{ host: string; onCancel: () => void }> = ({ host, onCancel }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t('domain_move_continue_on', { host })}
            description={t('domain_move_waiting_description')}
            actions={
                <>
                    <div className="flex h-14 items-center justify-center text-iconPrimary">
                        <Loader size="medium" />
                    </div>
                    <Button size="large" variant="secondary" fullWidth onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                </>
            }
        />
    );
};

/**
 * Listed the way the popup listed what left — name, kind and address — so the
 * person can see the two match.
 */
const WalletList: FC<{ wallets: MigrateWalletRow[]; alreadyHere: number }> = ({
    wallets,
    alreadyHere
}) => {
    const { t } = useTranslation();

    return (
        <>
            <ul className="flex flex-col gap-2 p-4">
                {wallets.map(wallet => (
                    <li
                        key={wallet.id}
                        className="flex items-center overflow-hidden rounded-2xl bg-backgroundContent"
                    >
                        <span className="shrink-0 py-4 pl-4">
                            <WalletAvatar
                                accountId={wallet.id}
                                emoji={wallet.emoji}
                                colorHex={wallet.colorHex}
                            />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col py-4 pl-3 pr-4">
                            <span className="flex items-center gap-1.5">
                                <span className="truncate text-label1 text-textPrimary">
                                    {wallet.name}
                                </span>
                                <AccountKindTag type={wallet.type} />
                            </span>
                            {wallet.label && (
                                <span className="truncate text-body2 text-textSecondary">
                                    {wallet.label}
                                </span>
                            )}
                        </span>
                    </li>
                ))}
            </ul>
            {alreadyHere > 0 && (
                <p className="px-8 pb-2 text-center text-body2 text-textSecondary">
                    {t('domain_move_already_here_rest', { count: alreadyHere })}
                </p>
            )}
        </>
    );
};

export const MigrateConfirm: FC<{
    host: string;
    wallets: MigrateWalletRow[];
    alreadyHere: number;
    onAdd: () => void;
    onNotMine: () => void;
}> = ({ host, wallets, alreadyHere, onAdd, onNotMine }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t(
                wallets.length === 1
                    ? 'domain_move_confirm_title_single'
                    : 'domain_move_confirm_title_multiple'
            )}
            subtitle={<WithEmphasis text={t('domain_move_from_host', { host })} value={host} />}
            description={t('domain_move_confirm_description')}
            actions={
                <>
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onAdd}>
                        {t(wallets.length === 1 ? 'add_wallet' : 'domain_move_add_wallets')}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onNotMine}>
                        {t('domain_move_not_my_wallets')}
                    </Button>
                </>
            }
        >
            <WalletList wallets={wallets} alreadyHere={alreadyHere} />
        </MigrationCard>
    );
};

export const MigrateNotMine: FC<{
    host: string;
    onMoveManually: () => void;
    onContinueWithout: () => void;
}> = ({ host, onMoveManually, onContinueWithout }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t('domain_move_not_mine_title')}
            description={t('domain_move_not_mine_description', { host })}
            actions={
                <>
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onMoveManually}>
                        {t('domain_move_move_manually')}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onContinueWithout}>
                        {t('domain_move_continue_without')}
                    </Button>
                </>
            }
        />
    );
};

export const MigrateAlreadyHere: FC<{ host: string; onContinue: () => void }> = ({
    host,
    onContinue
}) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t('domain_move_already_here_title')}
            subtitle={<WithEmphasis text={t('domain_move_from_host', { host })} value={host} />}
            description={t('domain_move_already_here_description')}
            actions={
                <Button size="large" variant="primaryBlue" fullWidth onClick={onContinue}>
                    {t('continue')}
                </Button>
            }
        />
    );
};

export const MigrateNoWallets: FC<{
    host: string;
    onRestoreWithPhrase: () => void;
    onBack: () => void;
}> = ({ host, onRestoreWithPhrase, onBack }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t('domain_move_no_wallets_title')}
            description={t('domain_move_no_wallets_description', { host })}
            actions={
                <>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        onClick={onRestoreWithPhrase}
                    >
                        {t('domain_move_restore_with_phrase')}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onBack}>
                        {t('domain_move_back')}
                    </Button>
                </>
            }
        />
    );
};

export const MigrateRejected: FC<{
    onTryAgain: () => void;
    onRestoreWithPhrase: () => void;
}> = ({ onTryAgain, onRestoreWithPhrase }) => {
    const { t } = useTranslation();

    return (
        <MigrationCard
            title={t('domain_move_rejected_title')}
            description={t('domain_move_rejected_description')}
            actions={
                <>
                    <Button size="large" variant="primaryBlue" fullWidth onClick={onTryAgain}>
                        {t('try_again')}
                    </Button>
                    <Button
                        size="large"
                        variant="secondary"
                        fullWidth
                        onClick={onRestoreWithPhrase}
                    >
                        {t('domain_move_restore_with_phrase')}
                    </Button>
                </>
            }
        />
    );
};

const PASSWORD_FIELD_ID = 'migrate-shared-password';

/**
 * Asked only when this origin already has password wallets of its own. One
 * password unlocks every wallet here, so the incoming wallets are added only
 * once the same password is shown to open both sides. A rejected password
 * clears the field. `onMoveManually` is passed once a password has been
 * rejected: two different passwords can't pass here, and the old origin is
 * where the phrases can still be read back.
 */
export const MigratePassword: FC<{
    host: string;
    checking: boolean;
    failed: boolean;
    onSubmit: (password: string) => void;
    onPasswordChange: () => void;
    onCancel: () => void;
    onMoveManually?: () => void;
}> = ({ host, checking, failed, onSubmit, onPasswordChange, onCancel, onMoveManually }) => {
    const { t } = useTranslation();
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (failed) {
            setPassword('');
        }
    }, [failed]);

    const submit = (event?: FormEvent) => {
        event?.preventDefault();

        if (!checking && password) {
            onSubmit(password);
        }
    };

    return (
        <MigrationCard
            title={t('domain_move_password_title')}
            description={t('domain_move_password_description', { host })}
            actions={
                <>
                    <Button
                        size="large"
                        variant="primaryBlue"
                        fullWidth
                        disabled={!password}
                        loading={checking}
                        onClick={() => submit()}
                    >
                        {t('domain_move_add_wallets')}
                    </Button>
                    <Button size="large" variant="secondary" fullWidth onClick={onCancel}>
                        {t('cancel')}
                    </Button>
                    {onMoveManually && (
                        <Button size="large" variant="tertiary" fullWidth onClick={onMoveManually}>
                            {t('domain_move_move_manually')}
                        </Button>
                    )}
                </>
            }
        >
            <form className="px-4" onSubmit={submit}>
                <Input
                    id={PASSWORD_FIELD_ID}
                    type="password"
                    autoComplete="current-password"
                    autoFocus
                    value={password}
                    onChange={value => {
                        setPassword(value);
                        onPasswordChange();
                    }}
                    isValid={!failed}
                    helpText={failed ? t('domain_move_wrong_password') : undefined}
                    label={t('Password')}
                    disabled={checking}
                />
            </form>
        </MigrationCard>
    );
};
