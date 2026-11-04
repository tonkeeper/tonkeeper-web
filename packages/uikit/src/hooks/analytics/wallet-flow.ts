import { useContext, useEffect, useMemo, useRef } from 'react';
import { AnalyticsEvent } from '@tonkeeper/core/dist/analytics';
import { AddWalletContext } from '../../components/create/AddWalletContext';
import { useAnalyticsTrack } from './index';

/**
 * The wallet create / import / backup funnel. Every event carries the wallet
 * kind (`wallet_mode`) plus the context it was started from, so the same flows
 * can be told apart between first-run onboarding and adding another wallet
 * later from the main app.
 */

type CreateStartedEvent = Extract<AnalyticsEvent, { eventName: 'wallet_create_started' }>;
type ImportStartedEvent = Extract<AnalyticsEvent, { eventName: 'wallet_import_started' }>;
type BackupStartedEvent = Extract<AnalyticsEvent, { eventName: 'wallet_backup_started' }>;
type BackupErrorEvent = Extract<AnalyticsEvent, { eventName: 'wallet_backup_error' }>;

export type AddWalletSource = CreateStartedEvent['from'];
export type WalletFlowMode = CreateStartedEvent['wallet_mode'];
export type WalletFlowSource = ImportStartedEvent['wallet_source'];
export type BackupFlowSource = BackupStartedEvent['source'];

type ErrorFields = Pick<BackupErrorEvent, 'error_type' | 'error_code' | 'error_message'>;

/** Shared with the native apps so the same failure groups across platforms. */
export const BACKUP_MISMATCH_ERROR_TYPE = 'recovery_phrase_confirmation_mismatch';

export const toWalletFlowError = (
    error: unknown,
    error_type: string | null = null
): ErrorFields => ({
    error_type,
    error_code: null,
    error_message:
        error == null ? null : error instanceof Error ? error.message : String(error) || null
});

/**
 * The add-wallet flow's own tracker. `from` is captured when the flow opens
 * (see `useAddWalletFlow`) and stays fixed for its lifetime — creating the
 * first wallet turns the app into a "has accounts" app halfway through, so it
 * cannot be derived at emit time.
 */
export const useAddWalletFlowAnalytics = () => {
    const { analyticsFrom } = useContext(AddWalletContext);
    return useWalletFlowAnalytics(analyticsFrom);
};

/**
 * Import funnel for the add-wallet methods whose kind is fixed the moment the
 * method is picked — hardware pairings, watch-only, private key, and the
 * TON-only mnemonic imports. `wallet_import_started` fires on mount, since
 * mounting the method screen *is* the user picking it.
 *
 * The mainnet mnemonic import can't use this: its `wallet_mode` only becomes
 * known once the phrase has been read.
 */
export const useImportFlowAnalytics = (
    wallet_source: WalletFlowSource,
    wallet_mode: WalletFlowMode = 'single'
) => {
    const analytics = useAddWalletFlowAnalytics();
    const started = useRef(false);

    useEffect(() => {
        if (started.current) return;
        started.current = true;
        analytics.importStarted(wallet_mode, wallet_source);
    }, [analytics, wallet_mode, wallet_source]);

    return useMemo(
        () => ({
            success: () => analytics.importSuccess(wallet_mode, wallet_source),
            error: (error: unknown) =>
                analytics.importError(wallet_mode, wallet_source, toWalletFlowError(error))
        }),
        [analytics, wallet_mode, wallet_source]
    );
};

export const useWalletFlowAnalytics = (from: AddWalletSource) => {
    const track = useAnalyticsTrack();

    return useMemo(
        () => ({
            menuView: () => track({ eventName: 'add_wallet_menu_view', from }),

            createStarted: (wallet_mode: WalletFlowMode) =>
                track({ eventName: 'wallet_create_started', wallet_mode, from }),

            createSuccess: (wallet_mode: WalletFlowMode, backed_up: boolean) =>
                track({ eventName: 'wallet_create_success', wallet_mode, backed_up, from }),

            backupStarted: (wallet_mode: WalletFlowMode, source: BackupFlowSource) =>
                track({ eventName: 'wallet_backup_started', wallet_mode, source }),

            backupSkip: (wallet_mode: WalletFlowMode, source: BackupFlowSource) =>
                track({ eventName: 'wallet_backup_skip', wallet_mode, source }),

            backupSuccess: (wallet_mode: WalletFlowMode, source: BackupFlowSource) =>
                track({ eventName: 'wallet_backup_success', wallet_mode, source }),

            backupError: (
                wallet_mode: WalletFlowMode,
                source: BackupFlowSource,
                error: ErrorFields
            ) => track({ eventName: 'wallet_backup_error', wallet_mode, source, ...error }),

            importStarted: (wallet_mode: WalletFlowMode, wallet_source: WalletFlowSource) =>
                track({ eventName: 'wallet_import_started', wallet_mode, wallet_source, from }),

            importSuccess: (wallet_mode: WalletFlowMode, wallet_source: WalletFlowSource) =>
                track({ eventName: 'wallet_import_success', wallet_mode, wallet_source, from }),

            importError: (
                wallet_mode: WalletFlowMode,
                wallet_source: WalletFlowSource,
                error: ErrorFields
            ) =>
                track({
                    eventName: 'wallet_import_error',
                    wallet_mode,
                    wallet_source,
                    from,
                    ...error
                })
        }),
        [track, from]
    );
};
