import BigNumber from 'bignumber.js';
import { Address } from '@ton/core';
import { APIConfig } from '../../entries/apis';
import { CellSigner, TronSigner } from '../../entries/signer';
import { TonWalletStandard } from '../../entries/wallet';
import { UserCancelledError } from '../../errors/UserCancelledError';
import { delay } from '../../utils/common';
import { notNullish } from '../../utils/types';
import {
    Configuration as BatteryConfiguration,
    DefaultApi as BatteryDefaultApi,
    InitOverrideFunction as BatteryInitOverrideFunction
} from '../../batteryApi';
import { BlockchainApi, InitOverrideFunction } from '../../tonApiV2';
import { TronAccountBalances, TronApi } from '../../tronApi';
import { getWalletSeqNo } from '../ton-blockchain/utils';
import {
    getMigrationWallets,
    MigrationPrepared,
    MigrationWalletValue,
    prepareMigration
} from './migrationApi';
import { MigrationBatteryAccess, waitForBatteryIdle, withBatteryExcess } from './migrationBattery';
import { signMigrationTransaction } from './migrationSigner';
import {
    loadMigrationVerificationContext,
    MigrationVerificationContext,
    verifyMigrationBatch,
    VerifiedMigrationTransaction
} from './migrationVerifier';
import {
    emptyMigrationTronPlan,
    hasTronTransfers,
    MigrationTronFeeMethod,
    MigrationTronPlan,
    prepareTronMigrationPlan,
    sendTronMigration,
    tronPlanForFeeMethod,
    withoutMigrationDust
} from './migrationTronService';

/**
 * Orchestration of the legacy-wallet → multichain asset migration.
 * The flow mirrors both native apps: the backend prepares the TON
 * transaction batch, the client builds the TRON leg itself, and execution
 * runs tron_usdt → tron_trx → ton with a seqno wait between TON sends.
 * Neither wallet record changes — this is purely on-chain value transfer,
 * idempotently re-runnable while the source still holds assets.
 */

export type MigrationPart = 'setup' | 'tron_usdt' | 'tron_trx' | 'ton';

export type MigrationTonFeeMethod = 'ton' | 'battery';

export interface MigrationFailureDetails {
    /** HTTP status of the rejecting relay or node. */
    status?: number;
    /** Machine-readable `error-key` of a Battery rejection. */
    errorKey?: string;
    /** The failing send went through the Battery relay. */
    viaBattery?: boolean;
}

export class MigrationExecutionError extends Error {
    constructor(
        message: string,
        public readonly part: MigrationPart,
        /** true when earlier transactions of this run were already broadcast. */
        public readonly isPartial: boolean,
        public readonly cause?: unknown,
        public readonly details: MigrationFailureDetails = {}
    ) {
        super(message);
        this.name = 'MigrationExecutionError';
    }
}

interface HttpErrorBody {
    status: number;
    message?: string;
    errorKey?: string;
}

const httpErrorBodies = new WeakMap<object, Promise<HttpErrorBody>>();

/**
 * The generated clients reject with "Response returned an error code" and
 * leave the status and the relay's own explanation on `error.response`.
 * Memoized per error because a response body can be read only once.
 */
export function readHttpErrorBody(error: unknown): Promise<HttpErrorBody> | undefined {
    const response = (error as { response?: unknown } | null)?.response as Response | undefined;
    if (!response || typeof response.status !== 'number') {
        return undefined;
    }
    const known = httpErrorBodies.get(error as object);
    if (known) {
        return known;
    }
    const body = (async (): Promise<HttpErrorBody> => {
        try {
            const json = JSON.parse(await response.text());
            return {
                status: response.status,
                message: typeof json?.error === 'string' ? json.error : undefined,
                errorKey: typeof json?.['error-key'] === 'string' ? json['error-key'] : undefined
            };
        } catch {
            return { status: response.status };
        }
    })();
    httpErrorBodies.set(error as object, body);
    return body;
}

async function toMigrationExecutionError(
    error: unknown,
    fallbackMessage: string,
    part: MigrationPart,
    isPartial: boolean,
    viaBattery = false
): Promise<MigrationExecutionError> {
    const http = await readHttpErrorBody(error);
    const message =
        http?.message ??
        (error instanceof Error && error.message ? error.message : fallbackMessage);
    return new MigrationExecutionError(message, part, isPartial, error, {
        status: http?.status,
        errorKey: http?.errorKey,
        viaBattery
    });
}

export interface MigrationSourceCandidate {
    /** Stable id the caller uses to match results back (wallet id). */
    id: string;
    /** Raw TON address of the candidate version wallet. */
    tonAddress: string;
    /** Legacy TRON address bound to this wallet, when it has one. */
    tronAddress?: string;
}

export interface MigratableWalletValue {
    id: string;
    tonBalance: BigNumber;
    hasTonAssets: boolean;
    /** Priced jetton balances straight from the backend, for the picker row. */
    jettons: MigrationWalletValue['jettons'];
    nftCount: number;
    initialized: boolean;
    tronUsdt: BigNumber;
    tronTrx: BigNumber;
    hasTronAssets: boolean;
}

/**
 * Resolve which candidate wallets actually hold something migratable.
 * Wallets with neither TON-side assets nor TRON balances are dropped —
 * the same filter both natives apply to the picker.
 */
const TRON_BALANCE_FRESH_MS = 60_000;

const tronBalanceCache = new Map<string, { balances: TronAccountBalances; storedAt: number }>();

/**
 * One batched request for every unique address, then single-address requests for whatever the
 * batch left unanswered. An address that still fails falls back to its last known balance, or
 * is left out when there is none — a throttled TronGrid never produces a zero it did not read.
 */
export async function loadMigrationTronBalances(
    tronApi: TronApi,
    addresses: string[]
): Promise<Map<string, TronAccountBalances>> {
    const result = new Map<string, TronAccountBalances>();
    const store = (address: string, balances: TronAccountBalances) => {
        tronBalanceCache.set(address, { balances, storedAt: Date.now() });
        result.set(address, balances);
    };

    const unique = [...new Set(addresses)];
    const stale: string[] = [];
    for (const address of unique) {
        const cached = tronBalanceCache.get(address);
        if (cached && Date.now() - cached.storedAt < TRON_BALANCE_FRESH_MS) {
            result.set(address, cached.balances);
        } else {
            stale.push(address);
        }
    }

    if (stale.length > 0) {
        try {
            const loaded = await tronApi.getBalancesBatch(stale);
            loaded.forEach((balances, address) => store(address, balances));
        } catch (e) {
            console.warn('TRON balances batch failed, falling back per address', e);
        }
    }

    await Promise.all(
        stale
            .filter(address => !result.has(address))
            .map(async address => {
                try {
                    store(address, await tronApi.getBalances(address));
                } catch (e) {
                    const lastKnown = tronBalanceCache.get(address);
                    if (lastKnown) {
                        result.set(address, lastKnown.balances);
                    }
                    console.warn('TRON balance refresh failed', e);
                }
            })
    );

    return result;
}

export async function loadMigratableWalletValues({
    api,
    tronApi,
    candidates,
    currency
}: {
    api: APIConfig;
    tronApi?: TronApi;
    candidates: MigrationSourceCandidate[];
    currency: string;
}): Promise<MigratableWalletValue[]> {
    if (candidates.length === 0) {
        return [];
    }

    const values = await getMigrationWallets({
        api,
        addresses: candidates.map(c => c.tonAddress),
        currencies: [currency]
    });
    const valueByAddress = new Map(
        values.map(v => [Address.parse(v.account).toRawString(), v] as const)
    );

    const tronBalances = tronApi
        ? await loadMigrationTronBalances(
              tronApi,
              candidates.map(c => c.tronAddress).filter(notNullish)
          )
        : new Map<string, TronAccountBalances>();

    return candidates.flatMap(candidate => {
        const value = valueByAddress.get(Address.parse(candidate.tonAddress).toRawString());
        const tonBalance = new BigNumber(value?.balance ?? '0');
        const hasTonAssets =
            !!value &&
            (tonBalance.gt(0) ||
                value.nftCount > 0 ||
                value.jettons.some(j => new BigNumber(j.balance).gt(0)));

        const tron = candidate.tronAddress ? tronBalances.get(candidate.tronAddress) : undefined;
        const tronUsdt = new BigNumber(tron?.usdt ?? 0);
        const tronTrx = new BigNumber(tron?.trx ?? 0);
        const hasTronAssets = tronUsdt.gt(0) || withoutMigrationDust(tronTrx).gt(0);

        if (!hasTonAssets && !hasTronAssets) {
            return [];
        }

        return [
            {
                id: candidate.id,
                tonBalance,
                hasTonAssets,
                jettons: value?.jettons ?? [],
                nftCount: value?.nftCount ?? 0,
                initialized: value ? value.status === 'active' || value.status === 'frozen' : false,
                tronUsdt,
                tronTrx,
                hasTronAssets
            }
        ];
    });
}

export interface MigrationTonVariant {
    gasPayer: MigrationTonFeeMethod;
    prepared: MigrationPrepared;
    /** Locally verified view of `prepared`, one entry per transaction. */
    verified: VerifiedMigrationTransaction[];
    verificationContext: MigrationVerificationContext;
    /** Total nanotons burnt as fees by self-paid transactions. */
    totalGasSpent: BigNumber;
    /** Nanotons of gas Battery covers — the basis of the charge quote. */
    sponsoredGasSpent: BigNumber;
}

export interface PreparedMigration {
    /** Fee-method variants of the backend-prepared TON batch. */
    ton: {
        self?: MigrationTonVariant;
        battery?: MigrationTonVariant;
    };
    tron: MigrationTronPlan;
    /** Per-leg preparation failures, for analytics and blocking decisions. */
    errors: {
        ton?: unknown;
        tron?: unknown;
    };
}

export function migrationHasAnythingToSend(prepared: PreparedMigration): boolean {
    const tonTransactions =
        prepared.ton.self?.prepared.result.transactions.length ??
        prepared.ton.battery?.prepared.result.transactions.length ??
        0;
    return tonTransactions > 0 || hasTronTransfers(prepared.tron);
}

/**
 * Prepare both legs of the migration. A leg only runs when the source
 * actually holds assets on it, and a failed leg does not interrupt the
 * other leg's preparation — its error is surfaced in `errors` for the
 * caller to report and block on.
 */
export async function prepareMigrationLegs({
    api,
    tronApi,
    source,
    destination,
    currency,
    hasTonAssets,
    hasTronAssets,
    batteryApi
}: {
    api: APIConfig;
    tronApi?: TronApi;
    source: {
        wallet: TonWalletStandard;
        initialized: boolean;
        tronAddress?: string;
    };
    destination: {
        tonAddress: string;
        tronAddress?: string;
    };
    currency: string;
    hasTonAssets: boolean;
    hasTronAssets: boolean;
    /** Set when Battery is enabled; the battery variant is prepared alongside the self-paid one. */
    batteryApi?: BatteryConfiguration;
}): Promise<PreparedMigration> {
    const errors: PreparedMigration['errors'] = {};

    const publicKey = source.initialized ? undefined : source.wallet.publicKey;

    const variantArgs = {
        api,
        source: source.wallet,
        to: destination.tonAddress,
        currency,
        publicKey
    };
    const [self, battery] = hasTonAssets
        ? await Promise.all([
              prepareTonVariant(variantArgs).catch((e: unknown) => {
                  errors.ton = e;
                  return undefined;
              }),
              batteryApi
                  ? prepareBatteryVariant({ ...variantArgs, batteryApi }).catch(() => undefined)
                  : Promise.resolve(undefined)
          ])
        : [undefined, undefined];

    let tron = emptyMigrationTronPlan(source.tronAddress ?? '', destination.tronAddress ?? '');
    if (hasTronAssets && tronApi && source.tronAddress && destination.tronAddress) {
        try {
            tron = await prepareTronMigrationPlan({
                tronApi,
                fromAddress: source.tronAddress,
                toAddress: destination.tronAddress,
                batteryApi
            });
        } catch (e) {
            errors.tron = e;
        }
    }

    return {
        ton: { self, battery },
        tron,
        errors
    };
}

interface PrepareVariantArgs {
    api: APIConfig;
    source: TonWalletStandard;
    to: string;
    currency: string;
    publicKey?: string;
}

async function prepareTonVariant({
    source,
    ...args
}: PrepareVariantArgs): Promise<MigrationTonVariant> {
    const prepared = await prepareMigration({ ...args, from: source.rawAddress, gasPayer: 'self' });
    return toVerifiedVariant('ton', prepared, { ...args, source });
}

/**
 * The Battery fee method exists only when the backend sponsors at least one
 * transaction of the batch; otherwise there is nothing for Battery to pay.
 */
async function prepareBatteryVariant({
    batteryApi,
    source,
    ...args
}: PrepareVariantArgs & { batteryApi: BatteryConfiguration }): Promise<
    MigrationTonVariant | undefined
> {
    const [prepared, batteryConfig] = await Promise.all([
        prepareMigration({ ...args, from: source.rawAddress, gasPayer: 'battery' }),
        new BatteryDefaultApi(batteryApi).getConfig()
    ]);
    if (!prepared.result.transactions.some(tx => tx.sponsored)) {
        return undefined;
    }
    return toVerifiedVariant(
        'battery',
        {
            ...prepared,
            result: {
                ...prepared.result,
                transactions: prepared.result.transactions.map(tx =>
                    withBatteryExcess(tx, batteryConfig.excessAccount)
                )
            }
        },
        { ...args, source, batteryExcessAccount: batteryConfig.excessAccount }
    );
}

async function toVerifiedVariant(
    gasPayer: MigrationTonFeeMethod,
    prepared: MigrationPrepared,
    {
        api,
        source,
        to,
        batteryExcessAccount
    }: Pick<PrepareVariantArgs, 'api' | 'source' | 'to'> & { batteryExcessAccount?: string }
): Promise<MigrationTonVariant> {
    const { transactions } = prepared.result;
    const verificationContext = await loadMigrationVerificationContext({
        api,
        source: source.rawAddress,
        destination: to,
        version: source.version,
        transactions,
        batteryExcessAccount
    });
    const verified = verifyMigrationBatch(transactions, source.version, verificationContext);

    const sumGas = (sponsored: boolean) =>
        transactions.reduce(
            (sum, tx) => (tx.sponsored === sponsored ? sum.plus(tx.gasSpent) : sum),
            new BigNumber(0)
        );
    return {
        gasPayer,
        prepared,
        verified,
        verificationContext,
        totalGasSpent: sumGas(false),
        sponsoredGasSpent: sumGas(true)
    };
}

export interface MigrationProgress {
    part: MigrationPart;
    sentTransactions: number;
    totalTransactions: number;
}

const SEQNO_WAIT_INITIAL_DELAY_MS = 2000;
const SEQNO_WAIT_POLL_INTERVAL_MS = 1500;
const SEQNO_WAIT_TIMEOUT_MS = 60_000;

/**
 * Waits for the source wallet's on-chain seqno to reach `minimum` before
 * the next external message is broadcast. `false` means the deadline passed;
 * a failed seqno read is swallowed so a transient error cannot abandon a
 * migration that already broadcast part of its batch.
 */
async function waitForWalletSeqno(
    api: APIConfig,
    rawAddress: string,
    minimum: number
): Promise<boolean> {
    const deadline = Date.now() + SEQNO_WAIT_TIMEOUT_MS;
    let nextDelay = SEQNO_WAIT_INITIAL_DELAY_MS;

    while (Date.now() < deadline) {
        await delay(nextDelay);
        nextDelay = SEQNO_WAIT_POLL_INTERVAL_MS;
        try {
            if ((await getWalletSeqNo(api, rawAddress)) >= minimum) {
                return true;
            }
        } catch {
            continue;
        }
    }
    return false;
}

const BATTERY_PENDING_MESSAGES_ERROR_KEY = 'err-gasless-pending-messages';
const BATTERY_PENDING_RETRY_DELAYS_MS = [2000, 4000, 8000, 8000];

/**
 * The relay keeps a wallet's previous sponsored message pending for a while
 * after `GET /status` already reports it idle, and rejects the next one with
 * `err-gasless-pending-messages` — a "try again later" answer that is retried
 * with backoff. A seqno that moved past this message means it landed after
 * all, so it is not sent again.
 */
async function sendThroughBattery({
    api,
    battery,
    boc,
    sourceAddress,
    seqno,
    initOverrides
}: {
    api: APIConfig;
    battery: MigrationBatteryAccess;
    boc: string;
    sourceAddress: string;
    seqno: number;
    initOverrides: BatteryInitOverrideFunction;
}): Promise<void> {
    for (let attempt = 0; ; attempt++) {
        if (!(await waitForBatteryIdle(battery))) {
            throw new Error('Timed out waiting for Battery to accept the next transaction');
        }
        try {
            await new BatteryDefaultApi(battery.api).sendMessage(
                { xTonConnectAuth: battery.authToken, sendMessageRequest: { boc } },
                initOverrides
            );
            return;
        } catch (error) {
            const http = await readHttpErrorBody(error);
            if (
                http?.errorKey !== BATTERY_PENDING_MESSAGES_ERROR_KEY ||
                attempt >= BATTERY_PENDING_RETRY_DELAYS_MS.length
            ) {
                throw error;
            }
            await delay(BATTERY_PENDING_RETRY_DELAYS_MS[attempt]);
            const chainSeqno = await getWalletSeqNo(api, sourceAddress).catch(() => undefined);
            if (chainSeqno !== undefined && chainSeqno > seqno) {
                return;
            }
        }
    }
}

function generateMigrationId(): string {
    const hex = (length: number) =>
        Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    return `${hex(8)}-${hex(4)}-4${hex(3)}-${hex(4)}-${hex(12)}`;
}

export async function executeMigration({
    api,
    tronApi,
    sourceWallet,
    prepared,
    feeMethod,
    tronFeeMethod = 'trx',
    battery,
    signer,
    tronSigner,
    migrationId,
    onProgress
}: {
    api: APIConfig;
    tronApi?: TronApi;
    sourceWallet: TonWalletStandard;
    prepared: PreparedMigration;
    feeMethod: MigrationTonFeeMethod;
    tronFeeMethod?: MigrationTronFeeMethod;
    /** Required when the batch has sponsored transactions or the USDT transfer goes through Battery. */
    battery?: MigrationBatteryAccess;
    signer: CellSigner;
    tronSigner?: TronSigner;
    /** `X-Migration-ID` tracing header; one random id per attempt by default. */
    migrationId?: string;
    onProgress?: (progress: MigrationProgress) => void;
}): Promise<void> {
    const id = migrationId ?? generateMigrationId();
    const tonVariant = feeMethod === 'battery' ? prepared.ton.battery : prepared.ton.self;
    const tonTransactions = tonVariant?.prepared.result.transactions ?? [];
    const tronPlan = tronPlanForFeeMethod(prepared.tron, tronFeeMethod);
    const usdtViaBattery = tronFeeMethod === 'battery' && tronPlan.usdtAmount.gt(0);
    const tronSteps = (tronPlan.usdtAmount.gt(0) ? 1 : 0) + (tronPlan.trxSweepAmount.gt(0) ? 1 : 0);
    const totalTransactions = tonTransactions.length + tronSteps;

    if (totalTransactions === 0) {
        throw new MigrationExecutionError('Nothing to migrate', 'setup', false);
    }
    if (!battery && (usdtViaBattery || tonTransactions.some(tx => tx.sponsored))) {
        throw new MigrationExecutionError('Battery is not authorized', 'setup', false);
    }

    // Runs ahead of the TRON leg too: a rejected TON batch must not leave
    // the migration half done.
    if (tonVariant) {
        try {
            verifyMigrationBatch(
                tonTransactions,
                sourceWallet.version,
                tonVariant.verificationContext
            );
        } catch (error) {
            throw new MigrationExecutionError(
                error instanceof Error ? error.message : 'Migration batch failed verification',
                'setup',
                false,
                error
            );
        }
    }

    let sentTransactions = 0;
    const report = (part: MigrationPart) =>
        onProgress?.({ part, sentTransactions, totalTransactions });

    if (hasTronTransfers(tronPlan)) {
        if (!tronApi || !tronSigner) {
            throw new MigrationExecutionError('TRON signer is not available', 'setup', false);
        }
        let lastStartedTronPart: MigrationPart = tronPlan.usdtAmount.gt(0)
            ? 'tron_usdt'
            : 'tron_trx';
        report(lastStartedTronPart);
        try {
            await sendTronMigration({
                tronApi,
                plan: tronPlan,
                signer: tronSigner,
                usdtBattery: usdtViaBattery ? battery : undefined,
                onStepCompleted: step => {
                    sentTransactions += 1;
                    lastStartedTronPart = 'tron_trx';
                    report(step);
                }
            });
        } catch (error) {
            if (error instanceof UserCancelledError) {
                throw error;
            }
            throw await toMigrationExecutionError(
                error,
                'TRON migration failed',
                lastStartedTronPart,
                sentTransactions > 0,
                usdtViaBattery && lastStartedTronPart === 'tron_usdt'
            );
        }
    }

    if (!tonVariant || tonTransactions.length === 0) {
        return;
    }

    // Merged on top of the request's own headers — a plain RequestInit
    // override would replace them and drop Content-Type.
    const tracingHeaders = {
        'X-Migration-ID': id,
        'X-Migration-Fee': feeMethod === 'battery' ? 'battery' : 'native'
    };
    const withTracingHeaders: InitOverrideFunction = async ({ init }) => ({
        headers: { ...init.headers, ...tracingHeaders }
    });
    const withBatteryTracingHeaders: BatteryInitOverrideFunction = async ({ init }) => ({
        headers: { ...init.headers, ...tracingHeaders }
    });
    const blockchainApi = new BlockchainApi(api.tonApiV2);

    for (let index = 0; index < tonTransactions.length; index++) {
        const transaction = tonTransactions[index];
        try {
            const externalMessage = await signMigrationTransaction({
                transaction,
                wallet: sourceWallet,
                signer,
                context: tonVariant.verificationContext
            });
            const boc = externalMessage.toBoc().toString('base64');

            if (transaction.sponsored && battery) {
                await sendThroughBattery({
                    api,
                    battery,
                    boc,
                    sourceAddress: sourceWallet.rawAddress,
                    seqno: transaction.seqno,
                    initOverrides: withBatteryTracingHeaders
                });
            } else {
                await blockchainApi.sendBlockchainMessage(
                    { sendBlockchainMessageRequest: { boc } },
                    withTracingHeaders
                );
            }
        } catch (error) {
            if (error instanceof UserCancelledError) {
                throw error;
            }
            throw await toMigrationExecutionError(
                error,
                'Failed to send migration transaction',
                'ton',
                sentTransactions > 0,
                !!transaction.sponsored
            );
        }

        sentTransactions += 1;
        report('ton');

        const isLast = index === tonTransactions.length - 1;
        if (!isLast) {
            const reached = await waitForWalletSeqno(
                api,
                sourceWallet.rawAddress,
                transaction.seqno + 1
            );
            if (!reached) {
                throw new MigrationExecutionError(
                    'Timed out waiting for wallet seqno',
                    'ton',
                    true
                );
            }
        }
    }
}
