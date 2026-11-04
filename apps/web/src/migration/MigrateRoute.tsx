import { FC, useEffect, useRef, useState } from 'react';

import { Language, localizationText } from '@tonkeeper/core/dist/entries/language';
import { useAppSdk } from '@tonkeeper/uikit/dist/hooks/appSdk';
import { I18nClient, useTranslation } from '@tonkeeper/uikit/dist/hooks/translation';
import {
    MigrateAlreadyHere,
    MigrateConfirm,
    MigrateImporting,
    MigrateNotMine,
    MigrateNoWallets,
    MigrateOffer,
    MigratePassword,
    MigrateRejected,
    MigrateWaiting,
    toMigrateWalletRow
} from '@tonkeeper/uikit/dist/pages/migration/MigrateScreens';

import { DomainMigrationEvent, trackMigration } from './analytics';
import { MigrateLanding, resolveMigrateLanding } from './arrival';
import { OLD_HOST, OLD_ORIGIN_RECOVERY_URL } from './config';
import { HandoffSession, startHandoffPopup } from './handoffChannel';
import {
    adoptLegacyUserId,
    applyHandoffImport,
    HandoffImportPlan,
    isSharedPassword,
    planHandoffImport
} from './handoffImport';
import { sameOriginPath, takeResumePath } from './handoffRequest';

/**
 * Read the fragment and clear it from the address bar in the same breath. It
 * only ever says which screen to open and in what language, but nothing about
 * the move should stay in history or profile sync.
 */
const takeFragment = (): string => {
    const fragment = window.location.hash.replace(/^#/, '');

    if (window.location.hash) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    return fragment;
};

const go = (path: string) => () =>
    window.location.assign(sameOriginPath(path, window.location.origin));

type Step =
    | { kind: 'offer'; found: boolean; notice?: 'blocked' | 'closed' }
    | { kind: 'waiting' }
    | { kind: 'no-old-wallet' }
    | { kind: 'rejected' }
    | { kind: 'confirm'; plan: HandoffImportPlan }
    | { kind: 'not-mine' }
    | { kind: 'password'; plan: HandoffImportPlan }
    | { kind: 'importing' }
    | { kind: 'already-here' };

/**
 * Taken once per page load, outside React, so a remount or a strict-mode
 * double render can't find the fragment already wiped and the resume path
 * already spent.
 */
let landing:
    | { resumePath: string; step: Step; from: MigrateLanding['from']; language?: Language }
    | undefined;

/** The landing is reported once per page load, for the same reason. */
let landingTracked = false;

const takeLanding = () => {
    if (!landing) {
        const { found, from, language } = resolveMigrateLanding(takeFragment());

        landing = {
            resumePath: sameOriginPath(takeResumePath(), window.location.origin),
            step: { kind: 'offer', found },
            from,
            language
        };
    }

    return landing;
};

const showIn = async (i18n: I18nClient, language: Language) => {
    const locale = localizationText(language);

    if (locale !== i18n.language) {
        await i18n.reloadResources([locale]);
        await i18n.changeLanguage(locale);
    }
};

/**
 * Landing for the move from the old origin. Rendered above the wallet gate, so
 * it is reachable before any account exists.
 *
 * Nothing in its URL can carry wallets. They arrive only over the popup this
 * page opens, from the window it opened, on the old origin — see
 * `handoffChannel.ts` — and are written only after the person confirms the
 * list.
 */
export const MigrateRoute: FC = () => {
    const sdk = useAppSdk();
    const { t, i18n } = useTranslation();
    const [{ resumePath, step: initial, from, language: landingLanguage }] = useState(takeLanding);
    const [step, setStep] = useState<Step>(initial);
    const session = useRef<HandoffSession>();

    useEffect(() => () => session.current?.cancel(), []);

    useEffect(() => {
        if (landingTracked || initial.kind !== 'offer') {
            return;
        }

        landingTracked = true;

        if (from === 'check') {
            trackMigration(sdk, { eventName: 'domain_migration_check_answer', answer: 'found' });
        }

        trackMigration(sdk, { eventName: 'domain_migration_offer_view', from });
    }, [initial, from, sdk]);

    const track = (event: DomainMigrationEvent) => {
        trackMigration(sdk, event);
    };

    // Leaving the page would cancel the event, so it is sent first.
    const goAfter = (event: DomainMigrationEvent, path: string) => () => {
        trackMigration(sdk, event).then(go(path));
    };

    // The app applies the stored language only once a wallet exists, so until
    // the import the page follows the language the old origin sent, if any.
    useEffect(() => {
        if (landingLanguage !== undefined) {
            showIn(i18n, landingLanguage).catch(() => undefined);
        }
    }, [landingLanguage, i18n]);

    const openPopup = () => {
        // Straight from the click, with nothing awaited first, so the browser
        // still counts the popup as the person's own action.
        const current = startHandoffPopup();
        session.current = current;
        setStep({ kind: 'waiting' });

        current.outcome
            .then(async (outcome): Promise<Step> => {
                track({
                    eventName: 'domain_migration_popup_result',
                    outcome: outcome.kind === 'payload' ? 'approved' : outcome.kind
                });

                switch (outcome.kind) {
                    case 'payload':
                        return settlePlan(await planHandoffImport(outcome.entries, sdk.storage));
                    case 'none':
                        return { kind: 'no-old-wallet' };
                    case 'declined':
                        return { kind: 'offer', found: true };
                    case 'closed':
                    case 'blocked':
                        return { kind: 'offer', found: true, notice: outcome.kind };
                    case 'rejected':
                        return { kind: 'rejected' };
                }
            })
            .catch((): Step => {
                // Only a payload that arrived but could not be planned gets here.
                track({
                    eventName: 'domain_migration_import_result',
                    outcome: 'failed',
                    accounts_count: 0
                });
                return { kind: 'rejected' };
            })
            .then(next => {
                if (session.current === current) {
                    setStep(next);
                }
            });
    };

    const settlePlan = (plan: HandoffImportPlan): Step => {
        if (plan.accounts.length === 0) {
            track({
                eventName: 'domain_migration_import_result',
                outcome: 'already_here',
                accounts_count: plan.alreadyHere,
                legacy_user_id: plan.legacyUserId
            });
            return { kind: 'already-here' };
        }

        track({
            eventName: 'domain_migration_confirm_view',
            accounts_count: plan.accounts.length,
            already_here_accounts_count: plan.alreadyHere
        });
        return { kind: 'confirm', plan };
    };

    const confirmPlan = (plan: HandoffImportPlan) => {
        if (plan.passwordCheck) {
            setStep({ kind: 'password', plan });
        } else {
            runImport(plan);
        }
    };

    // A full load, so every query reads the new accounts from storage rather
    // than from a cache primed while there were none — and the imported
    // language setting applies with them.
    const openWallet = () => window.location.assign(resumePath);

    // The list was confirmed a step ago, so the wallet opens straight away;
    // the loader stays up through the navigation. The import is reported
    // before the old analytics id is adopted, so the event carries both ids.
    const runImport = (plan: HandoffImportPlan) => {
        setStep({ kind: 'importing' });
        applyHandoffImport(plan, sdk.storage).then(
            async () => {
                await trackMigration(sdk, {
                    eventName: 'domain_migration_import_result',
                    outcome: 'success',
                    accounts_count: plan.accounts.length,
                    legacy_user_id: plan.legacyUserId
                });
                await adoptLegacyUserId(plan, sdk.storage).catch(() => undefined);
                openWallet();
            },
            () => {
                track({
                    eventName: 'domain_migration_import_result',
                    outcome: 'failed',
                    accounts_count: plan.accounts.length,
                    legacy_user_id: plan.legacyUserId
                });
                setStep({ kind: 'rejected' });
            }
        );
    };

    // A new tab, not a navigation: nothing leaves `/migrate` for another origin.
    const openManualRecovery = () =>
        window.open(OLD_ORIGIN_RECOVERY_URL, '_blank', 'noopener,noreferrer');

    switch (step.kind) {
        case 'importing':
            return <MigrateImporting />;
        case 'offer':
            return (
                <MigrateOffer
                    host={OLD_HOST}
                    newHost={window.location.host}
                    found={step.found}
                    notice={step.notice}
                    onContinue={() => {
                        track({ eventName: 'domain_migration_offer_click', action: 'continue' });
                        openPopup();
                    }}
                    onNotNow={goAfter(
                        { eventName: 'domain_migration_offer_click', action: 'not_now' },
                        resumePath
                    )}
                />
            );
        case 'waiting':
            return <MigrateWaiting host={OLD_HOST} onCancel={() => session.current?.cancel()} />;
        case 'confirm':
            return (
                <MigrateConfirm
                    host={OLD_HOST}
                    wallets={step.plan.accounts.map(account =>
                        toMigrateWalletRow(account, t, step.plan.walletColors[account.id])
                    )}
                    alreadyHere={step.plan.alreadyHere}
                    onAdd={() => {
                        track({ eventName: 'domain_migration_confirm_click', action: 'add' });
                        confirmPlan(step.plan);
                    }}
                    onNotMine={() => {
                        track({ eventName: 'domain_migration_confirm_click', action: 'not_mine' });
                        setStep({ kind: 'not-mine' });
                    }}
                />
            );
        case 'not-mine':
            return (
                <MigrateNotMine
                    host={OLD_HOST}
                    onMoveManually={() => {
                        track({
                            eventName: 'domain_migration_not_mine_click',
                            action: 'move_manually'
                        });
                        openManualRecovery();
                    }}
                    onContinueWithout={goAfter(
                        {
                            eventName: 'domain_migration_not_mine_click',
                            action: 'continue_without'
                        },
                        resumePath
                    )}
                />
            );
        case 'already-here':
            return <MigrateAlreadyHere host={OLD_HOST} onContinue={openWallet} />;
        case 'password':
            return (
                <SharedPasswordPrompt
                    plan={step.plan}
                    onConfirmed={() => runImport(step.plan)}
                    onCancel={go(resumePath)}
                    onMoveManually={openManualRecovery}
                />
            );
        case 'no-old-wallet':
            return (
                <MigrateNoWallets
                    host={OLD_HOST}
                    onRestoreWithPhrase={go('/')}
                    onBack={go(resumePath)}
                />
            );
        case 'rejected':
            return <MigrateRejected onTryAgain={openPopup} onRestoreWithPhrase={go('/')} />;
    }
};

const SharedPasswordPrompt: FC<{
    plan: HandoffImportPlan;
    onConfirmed: () => void;
    onCancel: () => void;
    onMoveManually: () => void;
}> = ({ plan, onConfirmed, onCancel, onMoveManually }) => {
    const [checking, setChecking] = useState(false);
    const [failed, setFailed] = useState(false);
    const [rejectedOnce, setRejectedOnce] = useState(false);

    const submit = async (password: string) => {
        if (!plan.passwordCheck) {
            return;
        }

        setChecking(true);

        if (await isSharedPassword(plan.passwordCheck, password)) {
            onConfirmed();
            return;
        }

        setFailed(true);
        setRejectedOnce(true);
        setChecking(false);
    };

    return (
        <MigratePassword
            host={OLD_HOST}
            checking={checking}
            failed={failed}
            onSubmit={submit}
            onPasswordChange={() => setFailed(false)}
            onCancel={onCancel}
            onMoveManually={rejectedOnce ? onMoveManually : undefined}
        />
    );
};
