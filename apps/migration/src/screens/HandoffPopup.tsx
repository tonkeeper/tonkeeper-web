import { FC, useEffect, useRef, useState } from 'react';

import { HandoffAccount, readHandoffAccounts } from '../accounts';
import { popupMessage, PopupMessage, readRequest } from '../channel';
import { NEW_HOST, NEW_ORIGIN } from '../config';
import {
    HandoffEntries,
    HandoffRequest,
    hasPasswordVaults,
    sealHandoff,
    selectHandoffEntries,
    unlockVaults
} from '../handoff';
import { accountLabelText, accountNameText, t } from '../i18n';
import { MANUAL_RECOVERY_PATH } from '../routing';
import { markMigrated, readStorageSnapshot, StorageSnapshot } from '../storage';
import {
    Emphasis,
    Layout,
    PrimaryButton,
    SecondaryButton,
    Spinner,
    TextLink,
    Trans
} from './Layout';
import { PasswordPrompt } from './PasswordPrompt';
import { WalletAvatar } from './WalletAvatar';

/**
 * How long the opener gets to send its request. It is listening before this
 * window exists, so anything past this is an opener that went away.
 */
const REQUEST_TIMEOUT_MS = 10_000;

type Step =
    | { kind: 'connecting' }
    | { kind: 'consent'; request: HandoffRequest }
    | { kind: 'unlock'; request: HandoffRequest; entries: HandoffEntries }
    | { kind: 'sealing' }
    | { kind: 'sent' }
    | { kind: 'nothing-here' }
    | { kind: 'lost-opener' }
    | { kind: 'failed' };

const opener = (): Window | null => {
    const win = window.opener as Window | null;

    return win && !win.closed ? win : null;
};

/**
 * Only ever to the origin this build was made for. If the opener has
 * navigated anywhere else since, the browser drops the message rather than
 * deliver it there.
 */
const tellOpener = (message: PopupMessage): boolean => {
    const target = opener();

    if (!target) {
        return false;
    }

    target.postMessage(message, NEW_ORIGIN);
    return true;
};

/**
 * The popup closes the moment it has answered: the result is shown in the new
 * app's tab, which is where the person is going anyway. The screens behind
 * these calls only stay up in a browser that refuses to close the window.
 */
const closePopup = () => window.close();

const WalletList: FC<{ accounts: HandoffAccount[] }> = ({ accounts }) => (
    <ul className="flex flex-col gap-2 p-4">
        {accounts.map(account => (
            <li key={account.id} className="flex items-center rounded-2xl bg-backgroundContent">
                <span className="py-4 pl-4">
                    <WalletAvatar emoji={account.emoji} />
                </span>
                <span className="flex min-w-0 flex-grow flex-col py-4 pl-3 pr-4">
                    <span className="flex items-center gap-1.5">
                        <span className="truncate text-label1 text-textPrimary">
                            {accountNameText(account.name)}
                        </span>
                        {account.kind && (
                            <span
                                className={`shrink-0 rounded px-1.5 py-0.5 text-body4Caps uppercase ${
                                    account.kind === 'Multichain'
                                        ? 'bg-textAccent/[0.16] text-textAccent'
                                        : 'bg-backgroundContentTint text-textSecondary'
                                }`}
                            >
                                {account.kind}
                            </span>
                        )}
                    </span>
                    {account.label && (
                        <span className="truncate text-body2 text-textSecondary">
                            {accountLabelText(account.label)}
                        </span>
                    )}
                </span>
            </li>
        ))}
    </ul>
);

/**
 * The one place wallet data is allowed to leave this origin: a popup the new
 * origin opened, answering the window that opened it and nothing else. The
 * browser vouches for both ends — `event.source` is the opener and
 * `event.origin` the pinned new origin, or the request is ignored — and the
 * payload is posted to that origin only. It is built only after the person
 * approves a screen that names where it is going and, for a profile with
 * password wallets, enters the password that opens every one of them.
 */
export const HandoffPopup: FC<{ hasWalletData: boolean; canRecoverManually: boolean }> = ({
    hasWalletData,
    canRecoverManually
}) => {
    const [step, setStep] = useState<Step>(
        hasWalletData ? { kind: 'connecting' } : { kind: 'nothing-here' }
    );
    const answered = useRef(false);

    // Read once: the list on the consent screen and the payload are built
    // from this same snapshot, so what is approved is exactly what is sent.
    const [snapshot] = useState<StorageSnapshot>(readStorageSnapshot);
    const [accounts] = useState(() => readHandoffAccounts(snapshot));

    useEffect(() => {
        if (!hasWalletData) {
            tellOpener(popupMessage({ type: 'none' }));
            closePopup();
            return;
        }

        const onMessage = (event: MessageEvent) => {
            const request = readRequest(event, { opener: window.opener, newOrigin: NEW_ORIGIN });

            // The opener repeats its request if this page reloads; the first
            // one stands, so a request can't be swapped under the consent screen.
            if (request) {
                setStep(current =>
                    current.kind === 'connecting' ? { kind: 'consent', request } : current
                );
            }
        };

        window.addEventListener('message', onMessage);

        if (!tellOpener(popupMessage({ type: 'ready' }))) {
            setStep({ kind: 'lost-opener' });
        }

        const timeout = window.setTimeout(() => {
            setStep(current => (current.kind === 'connecting' ? { kind: 'lost-opener' } : current));
        }, REQUEST_TIMEOUT_MS);

        return () => {
            window.removeEventListener('message', onMessage);
            window.clearTimeout(timeout);
        };
    }, [hasWalletData]);

    const answer = (message: PopupMessage): boolean => {
        if (answered.current) {
            return false;
        }

        answered.current = tellOpener(message);
        return answered.current;
    };

    const decline = () => {
        answer(popupMessage({ type: 'declined' }));
        window.close();
    };

    const seal = async (request: HandoffRequest, entries: HandoffEntries) => {
        setStep({ kind: 'sealing' });

        try {
            const payload = await sealHandoff({
                request,
                entries,
                from: window.location.origin,
                to: NEW_ORIGIN
            });

            if (!answer(popupMessage({ type: 'payload', payload }))) {
                setStep({ kind: 'lost-opener' });
                return;
            }

            markMigrated();
            setStep({ kind: 'sent' });
            closePopup();
        } catch {
            setStep({ kind: 'failed' });
        }
    };

    const approve = (request: HandoffRequest) => {
        const entries = selectHandoffEntries(snapshot);

        if (hasPasswordVaults(entries)) {
            setStep({ kind: 'unlock', request, entries });
        } else {
            seal(request, entries);
        }
    };

    switch (step.kind) {
        case 'connecting':
        case 'sealing':
            return (
                <Layout
                    title={t(step.kind === 'sealing' ? 'handoff_encrypting' : 'handoff_connecting')}
                    description={t('handoff_takes_a_moment')}
                    actions={<Spinner />}
                />
            );
        case 'consent':
            return (
                <Layout
                    title={t(
                        accounts.length === 1
                            ? 'handoff_consent_title_single'
                            : 'handoff_consent_title_multiple'
                    )}
                    subtitle={
                        <Trans
                            k="handoff_consent_destination"
                            parts={{ host: <Emphasis>{NEW_HOST}</Emphasis> }}
                        />
                    }
                    description={t('handoff_consent_description')}
                    actions={
                        <>
                            <PrimaryButton onClick={() => approve(step.request)}>
                                {t(
                                    accounts.length === 1
                                        ? 'handoff_move_wallet'
                                        : 'handoff_move_wallets'
                                )}
                            </PrimaryButton>
                            <SecondaryButton onClick={decline}>{t('not_now')}</SecondaryButton>
                        </>
                    }
                >
                    <WalletList accounts={accounts} />
                </Layout>
            );
        case 'unlock':
            return (
                <PasswordPrompt
                    subtitle={
                        <Trans
                            k="handoff_unlock_destination"
                            parts={{ host: <Emphasis>{NEW_HOST}</Emphasis> }}
                        />
                    }
                    description={t('handoff_unlock_description')}
                    submitLabel={t(
                        accounts.length === 1 ? 'handoff_move_wallet' : 'handoff_move_wallets'
                    )}
                    onSubmit={async password => {
                        // Throws on a wrong password, which the prompt reports;
                        // the seal reports its own failures.
                        const unlocked = await unlockVaults(step.entries, password);
                        seal(step.request, unlocked);
                    }}
                    onCancel={decline}
                />
            );
        case 'sent':
            return (
                <Layout
                    title={t('handoff_sent_title')}
                    description={t('handoff_sent_description', { host: NEW_HOST })}
                />
            );
        case 'nothing-here':
            return (
                <Layout
                    title={t('handoff_nothing_here_title')}
                    description={t('handoff_nothing_here_description')}
                />
            );
        case 'lost-opener':
            return (
                <Layout
                    title={t('handoff_lost_opener_title')}
                    description={t('handoff_lost_opener_description', { host: NEW_HOST })}
                    actions={
                        <PrimaryButton href={`${NEW_ORIGIN}/`}>{t('open_new_app')}</PrimaryButton>
                    }
                />
            );
        case 'failed':
            return (
                <Layout
                    title={t('handoff_failed_title')}
                    description={t('handoff_failed_description')}
                    actions={
                        <>
                            <PrimaryButton href={`${NEW_ORIGIN}/`}>
                                {t('open_new_app')}
                            </PrimaryButton>
                            {canRecoverManually && (
                                <TextLink href={MANUAL_RECOVERY_PATH}>
                                    {t('manual_recovery_link')}
                                </TextLink>
                            )}
                        </>
                    }
                />
            );
    }
};
