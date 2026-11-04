import BigNumber from 'bignumber.js';
import { AssetAmount } from '../../entries/crypto/asset/asset-amount';
import { TRON_USDT_ASSET } from '../../entries/crypto/asset/constants';
import { TronSigner } from '../../entries/signer';
import { Configuration as BatteryConfiguration, DefaultApi as BatteryApi } from '../../batteryApi';
import { TronApi, TronResources } from '../../tronApi';
import { tronFetch } from '../../tronApi/tronGridTransport';
import { delay } from '../../utils/common';
import { joinUrl } from '../../utils/url';
import { TronTrc20Encoder } from '../tron-blockchain/encoder/tron-trc20-encoder';
import { TronTrxSender } from '../tron-blockchain/sender/tron-trx-sender';
import { assertTronTransactionMatches } from '../tron-blockchain/tron-transaction';
import { MigrationBatteryAccess, waitForBatteryIdle } from './migrationBattery';

/**
 * The TRON leg of the wallet migration: a TRC20 USDT transfer to the
 * multichain wallet followed by a native TRX sweep of what's left. Unlike
 * the TON leg, the backend does not prepare these — the client builds them,
 * mirroring Android `MigrationRepository.prepareTron`/`sendTronMigration`.
 * All amounts are in sun (TRX and USDT both use 6 decimals).
 */

/** Who pays the USDT transfer's resources; the TRX sweep is always self-paid. */
export type MigrationTronFeeMethod = 'trx' | 'battery';

/** Residual TRX below this is treated as migration dust and left behind. */
export const MIGRATION_TRX_DUST_THRESHOLD_SUN = new BigNumber(250_000);

export function withoutMigrationDust(amountSun: BigNumber): BigNumber {
    return amountSun.lt(MIGRATION_TRX_DUST_THRESHOLD_SUN) ? new BigNumber(0) : amountSun;
}

/** Createtransaction is stricter than burn-price estimates — keep a buffer. */
export function bufferedNativeTrxFeeSun(feeSun: BigNumber): BigNumber {
    return BigNumber.max(
        feeSun.plus(feeSun.dividedToIntegerBy(2)),
        feeSun.plus(100_000)
    ).integerValue(BigNumber.ROUND_CEIL);
}

export interface MigrationTronPlan {
    fromAddress: string;
    toAddress: string;
    /** USDT to transfer, in its smallest units. Zero — no USDT leg. */
    usdtAmount: BigNumber;
    /** TRX to sweep after fees are reserved. Zero — no planned sweep. */
    trxSweepAmount: BigNumber;
    usdtResources?: TronResources;
    /** TRX the USDT transfer burns for resources (fee shown to the user). */
    requiredTrxForUsdt: BigNumber;
    /** Buffered TRX reserve for the native sweep's own fee. */
    requiredTrxForSweep: BigNumber;
    /** Source TRX balance at prepare time, dust already zeroed. */
    migratableTrx: BigNumber;
    /**
     * Charges the Battery relay quotes for sponsoring the USDT transfer.
     * Absent when Battery is off, the quote failed, or there is no USDT.
     */
    usdtBatteryCharges?: number;
}

export function emptyMigrationTronPlan(fromAddress = '', toAddress = ''): MigrationTronPlan {
    return {
        fromAddress,
        toAddress,
        usdtAmount: new BigNumber(0),
        trxSweepAmount: new BigNumber(0),
        requiredTrxForUsdt: new BigNumber(0),
        requiredTrxForSweep: new BigNumber(0),
        migratableTrx: new BigNumber(0)
    };
}

/**
 * The plan as it runs under `method`. Battery sponsors the USDT transfer, so
 * nothing is burnt for it and the TRX it would have cost joins the sweep.
 */
export function tronPlanForFeeMethod(
    plan: MigrationTronPlan,
    method: MigrationTronFeeMethod
): MigrationTronPlan {
    if (method === 'trx' || plan.usdtAmount.lte(0)) {
        return plan;
    }
    return {
        ...plan,
        requiredTrxForUsdt: new BigNumber(0),
        trxSweepAmount: withoutMigrationDust(
            BigNumber.max(plan.migratableTrx.minus(plan.requiredTrxForSweep), 0)
        )
    };
}

export function hasTronTransfers(plan: MigrationTronPlan): boolean {
    return plan.usdtAmount.gt(0) || plan.trxSweepAmount.gt(0);
}

/** true when the source can't even pay the USDT transfer's TRX burn. */
export function tronFeeShortage(plan: MigrationTronPlan): boolean {
    return plan.usdtAmount.gt(0) && plan.migratableTrx.lt(plan.requiredTrxForUsdt);
}

export async function prepareTronMigrationPlan({
    tronApi,
    fromAddress,
    toAddress,
    batteryApi
}: {
    tronApi: TronApi;
    fromAddress: string;
    toAddress: string;
    /** Set when Battery is enabled; the USDT transfer is then also quoted in charges. */
    batteryApi?: BatteryConfiguration;
}): Promise<MigrationTronPlan> {
    if (fromAddress.toLowerCase() === toAddress.toLowerCase()) {
        return emptyMigrationTronPlan(fromAddress, toAddress);
    }

    const balances = await tronApi.getBalances(fromAddress);
    const usdtAmount = new BigNumber(balances.usdt);
    const migratableTrx = withoutMigrationDust(new BigNumber(balances.trx));

    if (usdtAmount.lte(0) && migratableTrx.lte(0)) {
        return emptyMigrationTronPlan(fromAddress, toAddress);
    }

    const freeBandwidth = await tronApi.getAccountBandwidth(fromAddress);

    let usdtResources: TronResources | undefined;
    let usdtBatteryCharges: number | undefined;
    let requiredTrxForUsdt = new BigNumber(0);
    let bandwidthLeft = freeBandwidth;
    if (usdtAmount.gt(0)) {
        const encoder = new TronTrc20Encoder({
            walletAddress: fromAddress,
            tronGridBaseUrl: tronApi.tronGridBaseUrl
        });
        const estimated = await tronApi.applyResourcesSafetyMargin(
            await tronApi.estimateResources(
                await encoder.encodeTransferEstimateRequest(
                    toAddress,
                    new AssetAmount({ asset: TRON_USDT_ASSET, weiAmount: usdtAmount })
                )
            )
        );
        bandwidthLeft = Math.max(0, freeBandwidth - estimated.bandwidth);
        usdtResources = {
            energy: estimated.energy,
            // Free account bandwidth covers the transfer — only energy is burnt.
            bandwidth: freeBandwidth >= estimated.bandwidth ? 0 : estimated.bandwidth
        };
        requiredTrxForUsdt = (
            await TronTrxSender.getBurnTrxAmountForResources(tronApi, usdtResources)
        ).weiAmount.integerValue(BigNumber.ROUND_CEIL);
        if (batteryApi) {
            usdtBatteryCharges = await quoteUsdtBatteryCharges({
                tronApi,
                batteryApi,
                fromAddress,
                resources: usdtResources
            });
        }
    }

    let requiredTrxForSweep = new BigNumber(0);
    if (migratableTrx.gt(0)) {
        requiredTrxForSweep = await nativeSweepReserveSun({
            tronApi,
            fromAddress,
            toAddress,
            amountSun: BigNumber.max(migratableTrx, 1),
            bandwidthAvailable: bandwidthLeft
        });
    }

    const reserved = requiredTrxForSweep.plus(usdtAmount.gt(0) ? requiredTrxForUsdt : 0);
    const trxSweepAmount = withoutMigrationDust(BigNumber.max(migratableTrx.minus(reserved), 0));

    if (usdtAmount.lte(0) && trxSweepAmount.lte(0)) {
        return emptyMigrationTronPlan(fromAddress, toAddress);
    }

    return {
        fromAddress,
        toAddress,
        usdtAmount,
        trxSweepAmount,
        usdtResources,
        requiredTrxForUsdt,
        requiredTrxForSweep,
        migratableTrx,
        usdtBatteryCharges
    };
}

/**
 * A failed quote only takes Battery off the table; TRX still pays. The relay
 * can't sponsor an account that doesn't exist on chain yet, so as on iOS
 * only TRX is offered there.
 */
async function quoteUsdtBatteryCharges({
    tronApi,
    batteryApi,
    fromAddress,
    resources
}: {
    tronApi: TronApi;
    batteryApi: BatteryConfiguration;
    fromAddress: string;
    resources: TronResources;
}): Promise<number | undefined> {
    try {
        if (!(await tronApi.isAccountActivated(fromAddress))) {
            return undefined;
        }
        const estimation = await new BatteryApi(batteryApi).tronEstimate({
            wallet: fromAddress,
            energy: resources.energy,
            bandwidth: resources.bandwidth
        });
        return estimation.totalCharges > 0 ? estimation.totalCharges : undefined;
    } catch (e) {
        console.warn('Battery quote for the TRON migration failed', e);
        return undefined;
    }
}

/**
 * TRX the sweep must leave behind for its own fee. A destination that was
 * never activated turns the sweep into an account creation, which burns a
 * fixed fee instead of drawing on free bandwidth.
 */
async function nativeSweepReserveSun({
    tronApi,
    fromAddress,
    toAddress,
    amountSun,
    bandwidthAvailable
}: {
    tronApi: TronApi;
    fromAddress: string;
    toAddress: string;
    amountSun: BigNumber;
    bandwidthAvailable?: number;
}): Promise<BigNumber> {
    if (!(await tronApi.isAccountActivated(toAddress))) {
        return (await tronApi.getAccountCreationFeeSun()).plus(
            bufferedNativeTrxFeeSun(new BigNumber(0))
        );
    }
    return bufferedNativeTrxFeeSun(
        await estimateNativeTransferFeeSun({
            tronApi,
            fromAddress,
            toAddress,
            amountSun,
            bandwidthAvailable
        })
    );
}

async function estimateNativeTransferFeeSun({
    tronApi,
    fromAddress,
    toAddress,
    amountSun,
    bandwidthAvailable
}: {
    tronApi: TronApi;
    fromAddress: string;
    toAddress: string;
    amountSun: BigNumber;
    bandwidthAvailable?: number;
}): Promise<BigNumber> {
    const transaction = await buildNativeTrxTransfer({
        tronGridBaseUrl: tronApi.tronGridBaseUrl,
        fromAddress,
        toAddress,
        amountSun
    });
    const bandwidthNeeded = tronApi.estimateBandwidth(transaction.raw_data_hex);
    const available = bandwidthAvailable ?? (await tronApi.getAccountBandwidth(fromAddress));
    if (available >= bandwidthNeeded) {
        return new BigNumber(0);
    }
    const prices = await tronApi.getResourcePrices();
    return prices.bandwidth.weiAmount
        .multipliedBy(bandwidthNeeded)
        .integerValue(BigNumber.ROUND_CEIL);
}

const TRONWEB_RETRY_DELAYS_MS = [3000, 6000];

/**
 * TronWeb fetches the reference block over its own HTTP client, outside the
 * paced TronGrid transport, so keyless TronGrid can throttle it — most often
 * right after the picker or a previous attempt has drawn on the same limits.
 * Building is side-effect free, so it is simply repeated.
 */
async function withTronWebRetry<T>(build: () => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
        try {
            return await build();
        } catch (error) {
            if (attempt >= TRONWEB_RETRY_DELAYS_MS.length) {
                throw error;
            }
            await delay(TRONWEB_RETRY_DELAYS_MS[attempt]);
        }
    }
}

async function buildNativeTrxTransfer({
    tronGridBaseUrl,
    fromAddress,
    toAddress,
    amountSun
}: {
    tronGridBaseUrl: string;
    fromAddress: string;
    toAddress: string;
    amountSun: BigNumber;
}) {
    const { TronWeb } = await import('tronweb');
    const tronWeb = new TronWeb({
        fullHost: tronGridBaseUrl,
        privateKey: undefined
    });
    const transaction = await withTronWebRetry(() =>
        tronWeb.transactionBuilder.sendTrx(toAddress, amountSun.toNumber(), fromAddress)
    );
    // The local tx id skips a `getsignweight` round trip that TronWeb would
    // send outside the rate-limited TronGrid transport.
    const extended = await tronWeb.transactionBuilder.extendExpiration(transaction, 60 * 10, {
        txLocal: true
    });
    assertTronTransactionMatches(extended, {
        contract: {
            type: 'transfer',
            owner: fromAddress,
            to: toAddress,
            amount: BigInt(amountSun.toFixed(0))
        },
        feeLimit: 0n
    });
    return extended;
}

const TRON_CONFIRMATION_POLL_INTERVAL_MS = 3000;
const TRON_CONFIRMATION_ATTEMPTS = 40;

/**
 * Blocks until the transaction executes so the follow-up TRX sweep reads a
 * settled balance. Executed-but-failed and never-seen both throw. The Battery
 * relay delegates energy before it broadcasts, so a sponsored transfer can
 * take well over a minute to land; the 120s budget matches both natives.
 */
async function waitForTronTransactionSuccess(tronApi: TronApi, txId: string): Promise<void> {
    for (let attempt = 0; attempt < TRON_CONFIRMATION_ATTEMPTS; attempt++) {
        await delay(TRON_CONFIRMATION_POLL_INTERVAL_MS);
        let result: string | undefined;
        try {
            const response = await tronFetch(
                joinUrl(tronApi.tronGridBaseUrl, '/wallet/gettransactioninfobyid'),
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: txId })
                }
            );
            const json = await response.json();
            if (json?.id || json?.blockNumber) {
                // A native TRX transfer has no contract receipt result.
                result = json.receipt?.result || 'SUCCESS';
            }
        } catch {
            continue;
        }
        if (result === 'SUCCESS') {
            return;
        }
        if (result) {
            throw new Error(`TRON transaction failed: ${result}`);
        }
    }
    throw new Error('Timed out waiting for TRON transaction confirmation');
}

function isInsufficientTrxBalance(error: unknown): boolean {
    return (
        error instanceof Error && error.message.toLowerCase().includes('balance is not sufficient')
    );
}

export type TronMigrationStep = 'tron_usdt' | 'tron_trx';

export async function sendTronMigration({
    tronApi,
    plan,
    signer,
    usdtBattery,
    onStepCompleted
}: {
    tronApi: TronApi;
    plan: MigrationTronPlan;
    signer: TronSigner;
    /** Sends the USDT transfer through the Battery relay instead of burning TRX. */
    usdtBattery?: MigrationBatteryAccess;
    onStepCompleted?: (step: TronMigrationStep) => void;
}): Promise<void> {
    if (!hasTronTransfers(plan)) {
        return;
    }

    if (plan.usdtAmount.gt(0)) {
        await sendUsdtTransfer({ tronApi, plan, signer, battery: usdtBattery });
        onStepCompleted?.('tron_usdt');
    }

    // After USDT the leftover TRX is swept even when no sweep was planned —
    // unburnt reserves may now clear the dust threshold.
    const tryTrxSweep = plan.trxSweepAmount.gt(0) || plan.usdtAmount.gt(0);
    if (tryTrxSweep) {
        const swept = await sweepTrx({
            tronApi,
            plan,
            signer,
            allowSkipInsufficient: plan.usdtAmount.gt(0) && plan.trxSweepAmount.lte(0)
        });
        if (swept) {
            onStepCompleted?.('tron_trx');
        }
    }
}

async function sendUsdtTransfer({
    tronApi,
    plan,
    signer,
    battery
}: {
    tronApi: TronApi;
    plan: MigrationTronPlan;
    signer: TronSigner;
    battery?: MigrationBatteryAccess;
}): Promise<void> {
    const encoder = new TronTrc20Encoder({
        walletAddress: plan.fromAddress,
        tronGridBaseUrl: tronApi.tronGridBaseUrl
    });
    const transaction = await encoder.encodeTransferTransaction(
        plan.toAddress,
        new AssetAmount({ asset: TRON_USDT_ASSET, weiAmount: plan.usdtAmount })
    );
    const signed = await signer(transaction);
    if (battery) {
        if (!(await waitForBatteryIdle(battery))) {
            throw new Error('Timed out waiting for Battery to finish pending transactions');
        }
        await new BatteryApi(battery.api).tronSend({
            xTonConnectAuth: battery.authToken,
            tronSendRequest: {
                tx: Buffer.from(JSON.stringify(signed)).toString('base64'),
                wallet: plan.fromAddress,
                energy: plan.usdtResources?.energy ?? 0,
                bandwidth: plan.usdtResources?.bandwidth ?? 0
            }
        });
    } else {
        await tronApi.broadcastSignedTransaction(signed);
    }
    // The relay accepts the transfer before it lands; the sweep must not race it for bandwidth.
    await waitForTronTransactionSuccess(tronApi, signed.txID);
}

async function sweepTrx({
    tronApi,
    plan,
    signer,
    allowSkipInsufficient
}: {
    tronApi: TronApi;
    plan: MigrationTronPlan;
    signer: TronSigner;
    allowSkipInsufficient: boolean;
}): Promise<boolean> {
    const amountSun = plan.trxSweepAmount.gt(0)
        ? plan.trxSweepAmount
        : await resolveTrxSweepAmountSun(tronApi, plan);
    if (!amountSun) {
        if (allowSkipInsufficient) {
            return false;
        }
        throw new Error('Unable to create TRX transfer');
    }

    try {
        await broadcastNativeTrx({ tronApi, plan, amountSun, signer });
        return true;
    } catch (error) {
        if (isInsufficientTrxBalance(error)) {
            const retried = await retryNativeTrxWithLowerAmount({
                tronApi,
                plan,
                initialAmountSun: amountSun,
                signer
            });
            if (retried) {
                return true;
            }
            if (allowSkipInsufficient) {
                console.warn('Skipping leftover TRX sweep after USDT:', error);
                return false;
            }
        }
        throw error;
    }
}

async function retryNativeTrxWithLowerAmount({
    tronApi,
    plan,
    initialAmountSun,
    signer
}: {
    tronApi: TronApi;
    plan: MigrationTronPlan;
    initialAmountSun: BigNumber;
    signer: TronSigner;
}): Promise<boolean> {
    let amountSun = initialAmountSun;
    for (let attempt = 0; attempt < 4; attempt++) {
        amountSun = amountSun.multipliedBy(4).dividedToIntegerBy(5);
        if (amountSun.lte(0)) {
            return false;
        }
        try {
            await broadcastNativeTrx({ tronApi, plan, amountSun, signer });
            return true;
        } catch (error) {
            if (!isInsufficientTrxBalance(error)) {
                throw error;
            }
        }
    }
    return false;
}

async function broadcastNativeTrx({
    tronApi,
    plan,
    amountSun,
    signer
}: {
    tronApi: TronApi;
    plan: MigrationTronPlan;
    amountSun: BigNumber;
    signer: TronSigner;
}): Promise<void> {
    const transaction = await buildNativeTrxTransfer({
        tronGridBaseUrl: tronApi.tronGridBaseUrl,
        fromAddress: plan.fromAddress,
        toAddress: plan.toAddress,
        amountSun
    });
    const signed = await signer(transaction);
    await tronApi.broadcastSignedTransaction(signed);
    await waitForTronTransactionSuccess(tronApi, signed.txID);
}

async function resolveTrxSweepAmountSun(
    tronApi: TronApi,
    plan: MigrationTronPlan
): Promise<BigNumber | undefined> {
    const balances = await tronApi.getBalances(plan.fromAddress);
    const balanceSun = withoutMigrationDust(new BigNumber(balances.trx));
    if (balanceSun.lte(0)) {
        return undefined;
    }

    const reserveSun = await nativeSweepReserveSun({
        tronApi,
        fromAddress: plan.fromAddress,
        toAddress: plan.toAddress,
        amountSun: balanceSun
    });
    const amountSun = withoutMigrationDust(balanceSun.minus(reserveSun));
    return amountSun.gt(0) ? amountSun : undefined;
}
