import { QueryClient, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';
import { TonWalletStandard } from '@tonkeeper/core/dist/entries/wallet';
import { MultichainTronWallet } from '@tonkeeper/core/dist/entries/tron/multichain-tron-wallet';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import {
    executeMigration,
    MigrationExecutionError,
    migrationHasAnythingToSend,
    MigrationPart,
    MigrationProgress,
    PreparedMigration,
    prepareMigrationLegs
} from '@tonkeeper/core/dist/service/migration/migrationService';
import { MigrationBatteryAccess } from '@tonkeeper/core/dist/service/migration/migrationBattery';
import { getMigrationSigners } from '@tonkeeper/core/dist/service/migration/migrationSigners';
import { emptyMigrationTronPlan } from '@tonkeeper/core/dist/service/migration/migrationTronService';
import {
    MigrationFeePlan,
    migrationFeeAsset
} from '@tonkeeper/core/dist/service/migration/migrationFeePlan';

import { useAppSdk } from '../../hooks/appSdk';
import { useAppContext } from '../../hooks/appContext';
import { useAnalyticsTrack } from '../../hooks/analytics';
import { anyOfKeysParts, QueryKey } from '../../libs/queryKey';
import { useTronApi } from '../tron/tron';
import { useAccountsState, useActiveAccount, useActiveApi } from '../wallet';
import { MigrationPickerWallet, useMigratableWallets } from './useMigration';
import { batteryAuthTokenStorageKey } from '../battery';
import { useMigrationBatteryApi } from './useMigrationBattery';
import { schedulePostBroadcastRefresh } from './transfer/pendingActivity';

/** The picker entry the confirm screen operates on, resolved by wallet id. */
export const useMigrationSourceWallet = (
    walletId: string | null
): {
    source: MigrationPickerWallet | undefined;
    /** true once the wallets list settled — a missing source is then final. */
    isResolved: boolean;
    isError: boolean;
    refetch: () => Promise<unknown>;
} => {
    const { data, isError, refetch } = useMigratableWallets();
    return {
        source: walletId ? data?.find(w => w.walletId === walletId) : undefined,
        isResolved: data !== undefined,
        isError,
        refetch
    };
};

export const useMigrationSourceTonWallet = (
    source: MigrationPickerWallet | undefined
): TonWalletStandard | undefined => {
    const accounts = useAccountsState();
    return source ? findSourceTonWallet(accounts, source) : undefined;
};

const findSourceTonWallet = (
    accounts: ReturnType<typeof useAccountsState>,
    source: MigrationPickerWallet
): TonWalletStandard | undefined => {
    const account = accounts.find(a => a.id === source.accountId);
    if (!account || (account.type !== 'mnemonic' && account.type !== 'mam')) {
        return undefined;
    }
    return account.allTonWallets.find(w => w.id === source.walletId);
};

/**
 * Imperative prepare, mirroring the natives' explicit loading/ready/failed
 * confirmation state. A mutation rather than a query on purpose: a prepared
 * batch bakes in seqnos and valid-until, so it must never be cached or
 * refetched behind the flow's back, and every failure must land in exactly
 * one error state — the natives show a full-screen "something went wrong"
 * with retry for any prepare failure.
 */
export const usePrepareMigrationMutation = () => {
    const api = useActiveApi();
    const tronApi = useTronApi();
    const { fiat } = useAppContext();
    const accounts = useAccountsState();
    const activeAccount = useActiveAccount();
    const track = useAnalyticsTrack();
    const batteryApi = useMigrationBatteryApi();

    return useMutation<PreparedMigration, Error, { source: MigrationPickerWallet }>(
        async ({ source }) => {
            if (activeAccount.type !== 'multichain') {
                throw new Error('Migration source is not available');
            }
            const sourceWallet = findSourceTonWallet(accounts, source);
            if (!sourceWallet) {
                throw new Error('Source wallet not found');
            }

            const destinationTron = activeAccount.getWalletByChain('tron') as
                | MultichainTronWallet
                | undefined;

            const prepared = await prepareMigrationLegs({
                api,
                tronApi,
                source: {
                    wallet: sourceWallet,
                    initialized: source.value.initialized,
                    tronAddress: source.tronAddress
                },
                destination: {
                    tonAddress: activeAccount.activeTonWallet.rawAddress,
                    tronAddress: destinationTron?.rawAddress
                },
                currency: fiat,
                hasTonAssets: source.value.hasTonAssets,
                hasTronAssets: source.value.hasTronAssets,
                batteryApi
            });

            if (prepared.errors.ton !== undefined) {
                track({
                    eventName: 'migrate_transaction_prepare_error',
                    chain: 'ton',
                    is_blocking: true,
                    error_type: 'fee_calculation_failed',
                    error_code: null,
                    error_message: errorMessage(prepared.errors.ton)
                });
            }
            if (prepared.errors.tron !== undefined) {
                track({
                    eventName: 'migrate_transaction_prepare_error',
                    chain: 'tron',
                    is_blocking: true,
                    error_type: 'fee_calculation_failed',
                    error_code: null,
                    error_message: errorMessage(prepared.errors.tron)
                });
            }
            // A leg holding assets failed to prepare — running the other leg
            // alone would end on the success screen while assets remain at
            // the source. Fee shortages are not errors (they surface as
            // `insufficientFunds` variants and skip the leg with a warning);
            // anything in `errors` is a hard failure and blocks the run.
            const legError = prepared.errors.ton ?? prepared.errors.tron;
            if (legError !== undefined) {
                throw legError instanceof Error ? legError : new Error(errorMessage(legError));
            }
            if (!migrationHasAnythingToSend(prepared)) {
                throw new Error('Nothing to migrate');
            }
            return prepared;
        }
    );
};

const errorMessage = (e: unknown): string =>
    e instanceof Error ? e.message : String(e ?? 'unknown error');

export interface ExecuteMigrationArgs {
    source: MigrationPickerWallet;
    prepared: PreparedMigration;
    plan: MigrationFeePlan;
    onProgress: (progress: MigrationProgress) => void;
}

export const useExecuteMigration = () => {
    const sdk = useAppSdk();
    const api = useActiveApi();
    const tronApi = useTronApi();
    const accounts = useAccountsState();
    const track = useAnalyticsTrack();
    const client = useQueryClient();
    const batteryApi = useMigrationBatteryApi();

    // Parts that fully settled this attempt — the analytics `is_partial`
    // counts whole parts, not transactions (a mid-batch TON failure with no
    // TRON legs before it reports is_partial=false, per the schema).
    const settledParts = useRef<Set<MigrationPart>>(new Set());
    const sentAnything = useRef(false);

    return useMutation<void, Error, ExecuteMigrationArgs>(
        async ({ source, prepared, plan, onProgress }) => {
            const sourceWallet = findSourceTonWallet(accounts, source);
            if (!sourceWallet) {
                throw new Error('Source wallet not found');
            }

            settledParts.current = new Set();
            sentAnything.current = false;

            const executable: PreparedMigration = {
                ...prepared,
                ton:
                    plan.execution === 'tron-only'
                        ? {}
                        : plan.method === 'battery'
                        ? { battery: plan.variant }
                        : { self: plan.variant },
                tron:
                    plan.execution === 'ton-only'
                        ? emptyMigrationTronPlan(prepared.tron.fromAddress, prepared.tron.toAddress)
                        : prepared.tron
            };

            const tonUsesBattery = plan.method === 'battery' && plan.execution !== 'tron-only';
            const tronUsesBattery =
                plan.tron.method === 'battery' &&
                plan.execution !== 'ton-only' &&
                executable.tron.usdtAmount.gt(0);
            let battery: MigrationBatteryAccess | undefined;
            if (tonUsesBattery || tronUsesBattery) {
                const stored = await sdk.storage.get<{ token: string }>(
                    batteryAuthTokenStorageKey(sourceWallet.publicKey)
                );
                if (!batteryApi || !stored?.token) {
                    throw new Error('Battery is not authorized');
                }
                battery = { api: batteryApi, authToken: stored.token };
            }

            const { signer, tronSigner } = await getMigrationSigners(
                sdk,
                source.accountId,
                source.walletId,
                tronApi.tronGridBaseUrl
            );

            await executeMigration({
                api,
                tronApi,
                sourceWallet,
                prepared: executable,
                feeMethod: plan.method,
                tronFeeMethod: plan.tron.method,
                battery,
                signer,
                tronSigner,
                onProgress: progress => {
                    if (progress.sentTransactions > 0) {
                        sentAnything.current = true;
                    }
                    if (progress.part === 'tron_usdt' || progress.part === 'tron_trx') {
                        if (progress.sentTransactions > 0) {
                            settledParts.current.add(progress.part);
                        }
                    }
                    onProgress(progress);
                }
            });
        },
        {
            onSuccess: (_, { plan }) => {
                track({
                    eventName: 'migrate_transaction_success',
                    fee_asset: migrationFeeAsset(plan)
                });
                refreshAfterMigration(client);
            },
            onError: (error, { plan }) => {
                if (sentAnything.current) {
                    refreshAfterMigration(client);
                }
                if (error instanceof UserCancelledError) {
                    return;
                }
                const executionError = error instanceof MigrationExecutionError ? error : undefined;
                const part = executionError?.part ?? ('setup' as const);
                const errorKey = executionError?.details.errorKey;
                const isPartial =
                    part === 'ton'
                        ? settledParts.current.size > 0
                        : part === 'tron_trx'
                        ? settledParts.current.has('tron_usdt')
                        : false;
                track({
                    eventName: 'migrate_transaction_error',
                    fee_asset: migrationFeeAsset(plan),
                    failed_part: part,
                    is_partial: isPartial,
                    error_type: 'transaction_send_failed',
                    error_code: executionError?.details.status ?? null,
                    error_message: errorKey
                        ? `${errorKey}: ${errorMessage(error)}`
                        : errorMessage(error)
                });
            }
        }
    );
};

/**
 * The indexers lag the broadcast by a few blocks, so a single invalidation
 * right after the last send refetches pre-migration balances; the
 * post-broadcast ladder re-reads the destination until they catch up.
 */
const refreshAfterMigration = (client: QueryClient) => {
    client.invalidateQueries(
        anyOfKeysParts(
            QueryKey.wallets,
            QueryKey.total,
            QueryKey.multichainWalletAssets,
            QueryKey.multichainActivity,
            QueryKey.tronAssets,
            QueryKey.multichainMigrationWallets
        )
    );
    schedulePostBroadcastRefresh(client);
};
