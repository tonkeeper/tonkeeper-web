import BigNumber from 'bignumber.js';
import type {
    MigrationTonFeeMethod,
    MigrationTonVariant,
    PreparedMigration
} from './migrationService';
import {
    hasTronTransfers,
    MigrationTronFeeMethod,
    MigrationTronPlan,
    tronFeeShortage,
    tronPlanForFeeMethod
} from './migrationTronService';

export interface MigrationBatteryCharges {
    required: number;
    /** `undefined` until the source's Battery is authorized and read. */
    available?: number;
}

export interface MigrationFeePlan {
    method: MigrationTonFeeMethod;
    variant?: MigrationTonVariant;
    canSwitch: boolean;
    /** Present when the backend offered a Battery-sponsored batch. */
    batteryCharges?: MigrationBatteryCharges;
    /** The Battery covers this leg's charges on top of what the TRON leg claims. */
    batteryPayable: boolean;
    tron: {
        method: MigrationTronFeeMethod;
        /** The TRON leg as it runs under `method`. */
        plan: MigrationTronPlan;
        /** Present when the relay quoted the USDT transfer — Battery is then on offer. */
        batteryCharges?: MigrationBatteryCharges;
        /** The Battery covers this leg's charges on top of what the TON leg claims. */
        batteryPayable: boolean;
    };
    /** Battery was picked while its balance is still being read; confirmation waits for it. */
    pending: boolean;
    /**
     * How this run will go: everything, one leg skipped for the other's
     * shortage, or nothing payable at all.
     */
    execution: 'ready' | 'ton-only' | 'tron-only' | 'blocked';
    tonShortage?: { required: string; available: string };
}

export const tonVariantPayable = (variant: MigrationTonVariant | undefined): boolean =>
    !!variant && !variant.prepared.insufficientFunds;

export const migrationBatteryRequiredCharges = (
    variant: MigrationTonVariant,
    unitTonRate: BigNumber
): number =>
    variant.sponsoredGasSpent
        .shiftedBy(-9)
        .div(unitTonRate)
        .integerValue(BigNumber.ROUND_UP)
        .toNumber();

/**
 * Resolves the fee methods and the executable subset of the migration.
 * Mirrors the natives' shortage rules: an unpayable leg is skipped with a
 * warning while the other leg proceeds; both unpayable blocks the run.
 *
 * Battery is preferred on each leg whenever the source's balance covers it,
 * as on iOS. Both legs draw on the one balance, so a leg's Battery is only
 * payable alongside what the other leg claims, and the TON leg is settled
 * first. An unread balance never makes Battery the default; a Battery the
 * user picked before the balance was read is kept as `pending`, and dropped
 * once the balance proves it unaffordable.
 */
export const resolveMigrationFeePlan = (
    prepared: PreparedMigration | undefined,
    methods: { ton?: MigrationTonFeeMethod; tron?: MigrationTronFeeMethod },
    battery: { unitTonRate: BigNumber; availableCharges?: number }
): MigrationFeePlan | undefined => {
    if (!prepared) {
        return undefined;
    }

    const available = battery.availableCharges;
    const affordable = (charges: number) => available !== undefined && available >= charges;
    const fits = (charges: number) => available === undefined || available >= charges;

    const batteryVariant = prepared.ton.battery;
    const batteryCharges = batteryVariant && {
        required: migrationBatteryRequiredCharges(batteryVariant, battery.unitTonRate),
        available
    };
    const tonRequired = batteryCharges?.required ?? 0;
    const tonBatteryOffered = tonVariantPayable(batteryVariant) && !!batteryCharges;

    const tronRequired = prepared.tron.usdtAmount.gt(0)
        ? prepared.tron.usdtBatteryCharges
        : undefined;
    const tronBatteryCharges =
        tronRequired !== undefined ? { required: tronRequired, available } : undefined;

    const tronChoice =
        methods.tron === 'battery' && !(tronRequired !== undefined && fits(tronRequired))
            ? undefined
            : methods.tron;
    const tronChoiceClaim = tronChoice === 'battery' ? tronRequired ?? 0 : 0;
    const tonChoice =
        methods.ton === 'battery' && !(tonBatteryOffered && fits(tonRequired + tronChoiceClaim))
            ? undefined
            : methods.ton;

    const tonMethod: MigrationTonFeeMethod =
        tonChoice ??
        (tonBatteryOffered && affordable(tonRequired + tronChoiceClaim) ? 'battery' : 'ton');
    const tonClaim = tonMethod === 'battery' ? tonRequired : 0;
    const tronBatteryPayable = tronRequired !== undefined && affordable(tonClaim + tronRequired);
    const tronMethod: MigrationTronFeeMethod =
        tronChoice ?? (tronBatteryPayable ? 'battery' : 'trx');
    const tronClaim = tronMethod === 'battery' ? tronRequired ?? 0 : 0;
    const batteryPayable = tonBatteryOffered && affordable(tonRequired + tronClaim);
    const pending =
        available === undefined && (tonMethod === 'battery' || tronMethod === 'battery');

    const variant = tonMethod === 'battery' ? batteryVariant : prepared.ton.self;
    const tronPlan = tronPlanForFeeMethod(prepared.tron, tronMethod);

    const hasTonTransactions = (variant?.prepared.result.transactions.length ?? 0) > 0;
    const tonPayable =
        hasTonTransactions &&
        (tonMethod === 'battery' ? pending || batteryPayable : tonVariantPayable(variant));
    const tronPresent = hasTronTransfers(tronPlan);
    const tronPayable =
        tronPresent &&
        (tronMethod === 'battery' ? pending || tronBatteryPayable : !tronFeeShortage(tronPlan));

    let execution: MigrationFeePlan['execution'];
    if (hasTonTransactions && tonPayable) {
        execution = tronPresent && !tronPayable ? 'ton-only' : 'ready';
    } else if (hasTonTransactions && !tonPayable) {
        execution = tronPayable ? 'tron-only' : 'blocked';
    } else {
        execution = tronPayable ? 'ready' : 'blocked';
    }

    return {
        method: tonMethod,
        variant,
        canSwitch: !!prepared.ton.self && !!batteryVariant,
        batteryCharges,
        batteryPayable,
        tron: {
            method: tronMethod,
            plan: tronPlan,
            batteryCharges: tronBatteryCharges,
            batteryPayable: tronBatteryPayable
        },
        pending,
        execution,
        tonShortage: variant?.prepared.insufficientDetails
    };
};

/**
 * The analytics events carry a single fee asset: Battery whenever a leg that
 * runs spends charges, as on Android, so a TRX-paid TRON leg does not hide a
 * Battery-paid TON batch.
 */
export const migrationFeeAsset = (plan: MigrationFeePlan) => {
    const tonRuns =
        plan.execution !== 'tron-only' &&
        (plan.variant?.prepared.result.transactions.length ?? 0) > 0;
    const tronRuns = plan.execution !== 'ton-only' && hasTronTransfers(plan.tron.plan);
    const batteryPays =
        (tonRuns && plan.method === 'battery') || (tronRuns && plan.tron.method === 'battery');
    return batteryPays ? ('battery_charges' as const) : ('coin' as const);
};
