/**
 * Helper to fetch real transaction data from TON blockchain via tonapi.
 * Used in tests when FETCH_REAL_FEES=1 environment variable is set.
 */

import { ExpectedFees } from './utils';

const TONAPI_BASE_URL = 'https://tonapi.io/v2';

// tonapi transaction response types (partial)
interface TonApiComputePhase {
    gas_fees?: number;
    gas_used?: number;
}

interface TonApiStoragePhase {
    fees_collected?: number;
}

interface TonApiActionPhase {
    fwd_fees?: number; // total forward fees = actionFee + fwdFeeRemaining
    total_fees?: number; // action fees only
}

interface TonApiTransaction {
    total_fees: number;
    utime: number;
    lt: number;
    compute_phase?: TonApiComputePhase;
    storage_phase?: TonApiStoragePhase;
    action_phase?: TonApiActionPhase;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch expected fees from tonapi by transaction hash.
 * Includes retry logic for rate limiting (429).
 */
export async function fetchExpectedFees(txHash: string): Promise<ExpectedFees> {
    const url = `${TONAPI_BASE_URL}/blockchain/transactions/${txHash}`;
    const maxRetries = 3;
    const baseDelay = 1000;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const response = await fetch(url);

        if (response.ok) {
            const data = await response.json();
            return parseFees(data);
        }

        if (response.status === 429 && attempt < maxRetries) {
            const delay = baseDelay * Math.pow(2, attempt);
            // eslint-disable-next-line no-console
            console.log(`Rate limited, retrying in ${delay}ms...`);
            await sleep(delay);
            continue;
        }

        throw new Error(`Failed to fetch transaction ${txHash}: ${response.status}`);
    }

    throw new Error(`Failed to fetch transaction ${txHash} after ${maxRetries} retries`);
}

function parseFees(data: TonApiTransaction): ExpectedFees {
    const computePhase = data.compute_phase ?? {};
    const storagePhase = data.storage_phase ?? {};
    const actionPhase = data.action_phase ?? {};

    const gasUsed = BigInt(computePhase.gas_used || 0);
    const gasFee = BigInt(computePhase.gas_fees || 0);
    const actionFee = BigInt(actionPhase.total_fees || 0);
    const storageFee = BigInt(storagePhase.fees_collected || 0);

    // fwd_fees = actionFee + fwdFeeRemaining (full forward fee)
    // If no action_phase (extension actions), fwdFeeRemaining = 0
    const totalFwdFees = BigInt(actionPhase.fwd_fees || 0);
    const fwdFeeRemaining = totalFwdFees - actionFee;

    // Calculate importFee from total_fees
    const totalFees = BigInt(data.total_fees || 0);
    const importFee = totalFees - gasFee - actionFee - storageFee;

    // walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining
    const walletFee = gasFee + actionFee + importFee + storageFee + fwdFeeRemaining;

    return {
        gasUsed,
        gasFee,
        actionFee,
        storageFee,
        importFee,
        fwdFeeRemaining,
        walletFee
    };
}

/**
 * Check if we should fetch real data from blockchain.
 * Set FETCH_REAL_FEES=1 to enable fetching.
 */
export function shouldFetchRealFees(): boolean {
    return process.env.FETCH_REAL_FEES === '1';
}

export interface VerifyResult {
    match: boolean;
    actual: ExpectedFees;
    diff: {
        gasUsed: bigint;
        gasFee: bigint;
        actionFee: bigint;
        storageFee: bigint;
        importFee: bigint;
        fwdFeeRemaining: bigint;
        walletFee: bigint;
    };
}

/**
 * Verify that real transaction matches our predictions.
 * Returns match status and detailed diff for debugging.
 */
export async function verifyTransactionFees(
    txHash: string,
    expected: ExpectedFees
): Promise<VerifyResult> {
    const actual = await fetchExpectedFees(txHash);

    const diff = {
        gasUsed: actual.gasUsed - expected.gasUsed,
        gasFee: actual.gasFee - expected.gasFee,
        actionFee: actual.actionFee - expected.actionFee,
        storageFee: actual.storageFee - expected.storageFee,
        importFee: actual.importFee - expected.importFee,
        fwdFeeRemaining: actual.fwdFeeRemaining - expected.fwdFeeRemaining,
        walletFee: actual.walletFee - expected.walletFee
    };

    const match = Object.values(diff).every(d => d === 0n);

    return { match, actual, diff };
}

/**
 * Format verification result for console output.
 */
export function formatVerifyResult(result: VerifyResult): string {
    const lines: string[] = [];

    if (result.match) {
        lines.push('MATCH: All fees match predictions exactly!');
    } else {
        lines.push('MISMATCH: Fees differ from predictions');
    }

    lines.push('');
    lines.push('Field           | Predicted | Actual    | Diff');
    lines.push('----------------|-----------|-----------|----------');

    const format = (name: string, pred: bigint, act: bigint, diff: bigint): string => {
        const diffStr = diff === 0n ? '0' : diff > 0n ? `+${diff}` : `${diff}`;
        return `${name.padEnd(15)} | ${String(pred).padStart(9)} | ${String(act).padStart(
            9
        )} | ${diffStr}`;
    };

    // Reconstruct predicted from actual - diff
    const predicted = {
        gasUsed: result.actual.gasUsed - result.diff.gasUsed,
        gasFee: result.actual.gasFee - result.diff.gasFee,
        actionFee: result.actual.actionFee - result.diff.actionFee,
        storageFee: result.actual.storageFee - result.diff.storageFee,
        importFee: result.actual.importFee - result.diff.importFee,
        fwdFeeRemaining: result.actual.fwdFeeRemaining - result.diff.fwdFeeRemaining,
        walletFee: result.actual.walletFee - result.diff.walletFee
    };

    lines.push(format('gasUsed', predicted.gasUsed, result.actual.gasUsed, result.diff.gasUsed));
    lines.push(format('gasFee', predicted.gasFee, result.actual.gasFee, result.diff.gasFee));
    lines.push(
        format('actionFee', predicted.actionFee, result.actual.actionFee, result.diff.actionFee)
    );
    lines.push(
        format('storageFee', predicted.storageFee, result.actual.storageFee, result.diff.storageFee)
    );
    lines.push(
        format('importFee', predicted.importFee, result.actual.importFee, result.diff.importFee)
    );
    lines.push(
        format(
            'fwdFeeRemaining',
            predicted.fwdFeeRemaining,
            result.actual.fwdFeeRemaining,
            result.diff.fwdFeeRemaining
        )
    );
    lines.push(
        format('walletFee', predicted.walletFee, result.actual.walletFee, result.diff.walletFee)
    );

    return lines.join('\n');
}
