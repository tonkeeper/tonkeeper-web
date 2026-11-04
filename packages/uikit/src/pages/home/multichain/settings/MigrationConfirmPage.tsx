import { FC, useEffect, useRef, useState } from 'react';
import BigNumber from 'bignumber.js';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { TON_ASSET, TRON_TRX_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { BasicAsset } from '@tonkeeper/core/dist/entries/crypto/asset/basic-asset';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import {
    MigrationExecutionError,
    MigrationProgress,
    MigrationTonFeeMethod,
    PreparedMigration
} from '@tonkeeper/core/dist/service/migration/migrationService';
import {
    MigrationTronFeeMethod,
    tronFeeShortage
} from '@tonkeeper/core/dist/service/migration/migrationTronService';
import {
    migrationFeeAsset,
    resolveMigrationFeePlan
} from '@tonkeeper/core/dist/service/migration/migrationFeePlan';

import { useAppContext } from '../../../../hooks/appContext';
import { useAnalyticsTrack } from '../../../../hooks/analytics';
import { useToast } from '../../../../hooks/useNotification';
import { useNavigate } from '../../../../hooks/router/useNavigate';
import { useSearchParams } from '../../../../hooks/router/useSearchParams';
import { useTranslation } from '../../../../hooks/translation';
import { MultichainRoute, MultichainSettingsRoute } from '../../../../libs/routes';
import { Button, Loader } from '../../../../primitives';
import { useActiveAccount } from '../../../../state/wallet';
import {
    useExecuteMigration,
    useMigrationSourceTonWallet,
    useMigrationSourceWallet,
    usePrepareMigrationMutation
} from '../../../../state/multichain/useMigrationConfirm';
import {
    useAuthorizeMigrationBattery,
    useMigrationBatteryCharges
} from '../../../../state/multichain/useMigrationBattery';
import { useBatteryUnitTonRate } from '../../../../state/battery';
import { SkeletonScope, useSkeletonMask } from '../../../../primitives/Skeleton';
import IcArrowDown16 from '../../../../icons/components/IcArrowDown16';
import IcBatteryFlash44 from '../../../../icons/components/IcBatteryFlash44';
import IcCheckmarkCircle32 from '../../../../icons/components/IcCheckmarkCircle32';
import IcExclamationmarkCircle28 from '../../../../icons/components/IcExclamationmarkCircle28';
import IcInformationCircle16 from '../../../../icons/components/IcInformationCircle16';
import IcRefresh16 from '../../../../icons/components/IcRefresh16';
import IcTrayArrowUp28 from '../../../../icons/components/IcTrayArrowUp28';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { NetworkFeeValue } from '../../../../components/transfer/multichain/NetworkFeeValue';
import { useNativeAsset } from '../../../../components/transfer/multichain/SendConfirmShell';
import {
    FeeMethodBatteryIcon,
    SendFeeMethodOption,
    SendFeeMethodSheet
} from '../../../../components/transfer/multichain/SendFeeMethodSheet';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { MultichainHistoryNftCard } from '../history/MultichainHistoryNftCard';
import { MigrationHowItWorksSheet } from './MigrationHowItWorksSheet';
import { SettingsPageLayout } from './SettingsPageLayout';
import {
    buildMigrationConfirmRows,
    formatMigrationAmount,
    formatMigrationFiat,
    formatMigrationShortage,
    MigrationConfirmRowData
} from './migration-confirm-utils';

/** Query param carrying the source wallet chosen on the picker. */
export const MIGRATION_SOURCE_WALLET_PARAM = 'walletId';

export const MigrationConfirmRow: FC<{ row: MigrationConfirmRowData; divider: boolean }> = ({
    row,
    divider
}) => {
    const mask = useSkeletonMask();

    return (
        <div>
            {divider && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
            <div className="flex w-full items-start">
                <div className="shrink-0 py-4 pl-4">
                    <div
                        className="flex size-11 items-center justify-center rounded-full bg-backgroundContentTint"
                        {...mask({ w: 44, h: 44, r: 22 })}
                    >
                        <IcTrayArrowUp28 className="size-7 text-iconSecondary" />
                    </div>
                </div>
                <div className="min-w-0 flex-1 p-4">
                    <div className="flex gap-4 text-label1 text-textPrimary">
                        <span className="min-w-0 flex-1 truncate" {...mask({ w: 45 })}>
                            {row.title}
                        </span>
                        <span
                            className="shrink-0 whitespace-nowrap text-right"
                            {...mask({ w: 90 })}
                        >
                            {row.value}
                        </span>
                    </div>
                    <div className="flex gap-4 text-body2 text-textSecondary">
                        <span className="min-w-0 flex-1 truncate" {...mask({ w: 90 })}>
                            {row.subtitle}
                        </span>
                        {row.fiat && (
                            <span
                                className="shrink-0 whitespace-nowrap text-right"
                                {...mask({ w: 50 })}
                            >
                                {row.fiat}
                            </span>
                        )}
                    </div>
                    {row.nft && (
                        <div className="pt-2">
                            <MultichainHistoryNftCard nft={row.nft} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SKELETON_CONFIRM_ROWS: MigrationConfirmRowData[] = Array.from({ length: 5 }, (_, i) => ({
    key: `skeleton-${i}`,
    title: 'Send',
    subtitle: '0',
    value: '0',
    fiat: '0'
}));

const FeeMethodCoinIcon: FC<{ asset: BasicAsset }> = ({ asset }) => (
    <img src={asset.image} alt="" className="size-11 rounded-full object-cover" />
);

const batteryIcon = (
    <FeeMethodBatteryIcon>
        <IcBatteryFlash44 />
    </FeeMethodBatteryIcon>
);

type Stage = 'idle' | 'sending' | 'success' | 'failed' | 'retry';

const SUCCESS_EXIT_DELAY_MS = 1000;
const FAILURE_FLASH_MS = 2000;
const TOAST_MESSAGE_MAX_LENGTH = 160;

/** Node and relay errors can carry stack traces or whole response bodies; the console keeps those. */
const toastMessage = (message: string) => {
    const firstLine = message.split('\n')[0].trim();
    return firstLine.length > TOAST_MESSAGE_MAX_LENGTH
        ? `${firstLine.slice(0, TOAST_MESSAGE_MAX_LENGTH)}…`
        : firstLine;
};

/**
 * Migration confirmation: the locally verified TON batch and the
 * client-built TRON transfers, fee rows, and the execution states.
 * Retrying after any failure always goes through a fresh prepare — a
 * partially sent batch must never be re-broadcast (double-send risk); the
 * new prepare simply lists whatever assets are still left at the source.
 */
export const MigrationConfirmPage: FC<{ compact?: boolean }> = ({ compact = false }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const toast = useToast();
    const { fiat } = useAppContext();
    const activeAccount = useActiveAccount();
    const track = useAnalyticsTrack();
    const [searchParams] = useSearchParams();
    const sourceWalletId = searchParams.get(MIGRATION_SOURCE_WALLET_PARAM);

    const {
        source,
        isResolved: isSourceResolved,
        isError: isSourceError,
        refetch: refetchSources
    } = useMigrationSourceWallet(sourceWalletId);
    const prepareMutation = usePrepareMigrationMutation();
    const sourceTonWallet = useMigrationSourceTonWallet(source);
    const { authToken: batteryToken, availableCharges } = useMigrationBatteryCharges(
        sourceTonWallet?.publicKey
    );
    const unitTonRate = useBatteryUnitTonRate();
    const authorizeBattery = useAuthorizeMigrationBattery();
    const trxPrice = useNativeAsset('tron')?.price;

    const [prepared, setPrepared] = useState<PreparedMigration>();
    const [prepareFailed, setPrepareFailed] = useState(false);
    // Bumping re-runs the prepare effect below — the retry affordance.
    const [prepareAttempt, setPrepareAttempt] = useState(0);
    const [feeMethod, setFeeMethod] = useState<MigrationTonFeeMethod>();
    const [tronFeeMethod, setTronFeeMethod] = useState<MigrationTronFeeMethod>();
    const [feeSheet, setFeeSheet] = useState<'ton' | 'tron'>();
    const [howItWorksOpen, setHowItWorksOpen] = useState(false);
    const [stage, setStage] = useState<Stage>('idle');
    const [progress, setProgress] = useState<MigrationProgress>();
    const execute = useExecuteMigration();

    const sourceWalletKey = source?.walletId;
    useEffect(() => {
        if (!sourceWalletKey || !source) {
            return;
        }
        let cancelled = false;
        setPrepared(undefined);
        setPrepareFailed(false);
        prepareMutation
            .mutateAsync({ source })
            .then(result => {
                if (!cancelled) setPrepared(result);
            })
            .catch(e => {
                console.warn('Migration prepare failed', e);
                if (!cancelled) setPrepareFailed(true);
            });
        return () => {
            cancelled = true;
        };
        // `prepareMutation`/`source` identities churn every render; the walletId
        // and the explicit attempt counter are the real triggers.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sourceWalletKey, prepareAttempt]);

    const plan = resolveMigrationFeePlan(
        prepared,
        { ton: feeMethod, tron: tronFeeMethod },
        { unitTonRate, availableCharges }
    );

    const confirmationTracked = useRef(false);
    useEffect(() => {
        if (prepared && plan && !confirmationTracked.current) {
            confirmationTracked.current = true;
            track({
                eventName: 'migrate_transaction_confirmation_view',
                fee_asset: migrationFeeAsset(plan)
            });
        }
    }, [prepared, plan, track]);

    // No wallet id, or the settled wallets list no longer offers this wallet
    // (it may have been drained by a previous run) — nothing to confirm here.
    const shouldLeave = !sourceWalletId || (isSourceResolved && !source);
    useEffect(() => {
        if (shouldLeave) {
            navigate(MultichainRoute.settings + MultichainSettingsRoute.migration, {
                replace: true
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shouldLeave]);

    // The flow holds a single history entry (picker and confirm replace each
    // other), so replacing it with home leaves nothing to navigate back into
    // — a drained source would only reopen on a failing prepare.
    useEffect(() => {
        if (stage === 'success') {
            const timer = setTimeout(
                () => navigate(MultichainRoute.home, { replace: true }),
                SUCCESS_EXIT_DELAY_MS
            );
            return () => clearTimeout(timer);
        }
        if (stage === 'failed') {
            const timer = setTimeout(() => setStage('retry'), FAILURE_FLASH_MS);
            return () => clearTimeout(timer);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [stage]);

    const showError = prepareFailed || isSourceError;
    const isReady = !!source && !!prepared && !!plan;

    // Confirming stays locked until the user has scrolled past every transfer
    // and fee row, as on the native confirm screens.
    const endRef = useRef<HTMLDivElement>(null);
    const [reviewedAll, setReviewedAll] = useState(false);
    useEffect(() => {
        const end = endRef.current;
        if (!isReady || reviewedAll || !end) {
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setReviewedAll(true);
            }
        });
        observer.observe(end);
        return () => observer.disconnect();
    }, [isReady, reviewedAll]);

    if (shouldLeave) {
        return null;
    }

    const onBack = () =>
        navigate(MultichainRoute.settings + MultichainSettingsRoute.migration, { replace: true });

    const onConfirm = async () => {
        if (!source || !prepared || !plan) {
            return;
        }
        setStage('sending');
        setProgress(undefined);
        try {
            await execute.mutateAsync({
                source,
                prepared,
                plan,
                onProgress: setProgress
            });
            setStage('success');
        } catch (e) {
            if (e instanceof UserCancelledError) {
                setStage('idle');
                return;
            }
            console.error('Migration failed', e);
            // A failed relay send has no fallback mid-run; the retry re-prepares with
            // that leg paid from the wallet instead.
            if (e instanceof MigrationExecutionError && e.details.viaBattery) {
                if (e.part === 'ton') {
                    setFeeMethod('ton');
                } else {
                    setTronFeeMethod('trx');
                }
                toast(t('migration_battery_send_failed'));
            } else {
                const message = e instanceof Error ? toastMessage(e.message) : undefined;
                if (message) {
                    toast(message);
                }
            }
            setStage('failed');
        }
    };

    // The picker's cached balances predate the failed attempt — what it already
    // moved decides which legs the fresh prepare runs.
    const onTryAgain = () => {
        setStage('idle');
        setProgress(undefined);
        setPrepared(undefined);
        setPrepareFailed(false);
        refetchSources().finally(() => setPrepareAttempt(attempt => attempt + 1));
    };

    const destination = activeAccount.type === 'multichain' ? activeAccount : undefined;

    const rows = isReady
        ? buildMigrationConfirmRows({
              sendLabel: t('wallet_send'),
              nftLabel: 'NFT',
              tonVariant: plan.execution === 'tron-only' ? undefined : plan.variant,
              sourceTonBalance: source.value.tonBalance,
              tron: plan.execution === 'ton-only' ? undefined : plan.tron.plan,
              pricing: {
                  currency: fiat,
                  ton: source.prices.ton,
                  usdt: source.prices.usdt,
                  trx: trxPrice,
                  jetton: jetton => {
                      const price = source.value.jettons.find(
                          j => j.jetton.address === jetton.jetton.address
                      )?.price?.prices?.[fiat];
                      return price === undefined ? undefined : new BigNumber(price);
                  }
              }
          })
        : [];

    /** A chain-coin fee as the fee row ("≈ $0.45 · TON") and the picker ("≈ $0.45 · 0.005 TON") show it. */
    const coinFee = (asset: BasicAsset, weiAmount: BigNumber, price: BigNumber | undefined) => {
        const amount = formatMigrationAmount(new AssetAmount({ asset, weiAmount }));
        const fiatText = price
            ? formatMigrationFiat(fiat, weiAmount.shiftedBy(-asset.decimals).multipliedBy(price))
            : undefined;
        return {
            row: fiatText ? { value: fiatText, unit: asset.symbol } : { value: amount },
            option: fiatText ? `≈ ${fiatText} · ${amount}` : `≈ ${amount}`
        };
    };
    const batteryFee = (charges: number) => ({
        value: t('send_fee_charges', { count: charges }),
        unit: t('send_fee_battery')
    });
    const tronTrxFee = (tronPlan: PreparedMigration['tron']) =>
        tronPlan.requiredTrxForUsdt.plus(tronPlan.requiredTrxForSweep);

    const tonFee =
        plan?.variant &&
        (plan.method === 'battery'
            ? batteryFee(plan.batteryCharges?.required ?? 0)
            : coinFee(TON_ASSET, plan.variant.totalGasSpent, source?.prices.ton).row);
    const tronFee =
        plan?.tron.method === 'battery' && plan.tron.batteryCharges
            ? batteryFee(plan.tron.batteryCharges.required)
            : plan && tronTrxFee(plan.tron.plan).gt(0)
            ? coinFee(TRON_TRX_ASSET, tronTrxFee(plan.tron.plan), trxPrice).row
            : undefined;
    const showTonFee = !!tonFee && plan?.execution !== 'tron-only';
    const showTronFee = !!tronFee && plan?.execution !== 'ton-only';

    const tonFeeOptions: SendFeeMethodOption<MigrationTonFeeMethod>[] = [
        ...(prepared?.ton.self
            ? [
                  {
                      key: 'ton' as const,
                      icon: <FeeMethodCoinIcon asset={TON_ASSET} />,
                      title: TON_ASSET.symbol,
                      subtitle: coinFee(
                          TON_ASSET,
                          prepared.ton.self.totalGasSpent,
                          source?.prices.ton
                      ).option,
                      // The option shows the burnt gas, but the batch also needs the TON
                      // its jetton transfers attach up front — the backend's shortage
                      // verdict is the one that counts, as on both natives.
                      disabled: prepared.ton.self.prepared.insufficientFunds
                  }
              ]
            : []),
        ...(plan?.batteryCharges
            ? [
                  {
                      key: 'battery' as const,
                      icon: batteryIcon,
                      title: t('battery_title'),
                      subtitle: t('send_fee_charges', { count: plan.batteryCharges.required }),
                      disabled: plan.batteryCharges.available !== undefined && !plan.batteryPayable
                  }
              ]
            : [])
    ];
    const tronFeeOptions: SendFeeMethodOption<MigrationTronFeeMethod>[] =
        prepared && plan?.tron.batteryCharges
            ? [
                  {
                      key: 'trx',
                      icon: <FeeMethodCoinIcon asset={TRON_TRX_ASSET} />,
                      title: TRON_TRX_ASSET.symbol,
                      subtitle: coinFee(TRON_TRX_ASSET, tronTrxFee(prepared.tron), trxPrice).option,
                      disabled: tronFeeShortage(prepared.tron)
                  },
                  {
                      key: 'battery',
                      icon: batteryIcon,
                      title: t('battery_title'),
                      subtitle: t('send_fee_charges', {
                          count: plan.tron.batteryCharges.required
                      }),
                      disabled:
                          plan.tron.batteryCharges.available !== undefined &&
                          !plan.tron.batteryPayable
                  }
              ]
            : [];

    /** Both legs spend the source's Battery, which needs its TonProof token: picking it mints one. */
    const selectFeeMethod = <M extends string>(method: M, apply: (method: M) => void) => {
        if (method !== 'battery' || batteryToken || !source || !sourceTonWallet) {
            apply(method);
            return;
        }
        authorizeBattery
            .mutateAsync({ accountId: source.accountId, wallet: sourceTonWallet })
            .then(() => apply(method))
            .catch(() => undefined);
    };

    const totalParts = [
        source?.fiatTotal?.gt(0) ? formatMigrationFiat(fiat, source.fiatTotal) : undefined,
        source && source.value.nftCount > 0
            ? t('migration_nft_count', { count: String(source.value.nftCount) })
            : undefined
    ].filter(Boolean);
    const totalLabel = totalParts.length ? `${t('total')}: ${totalParts.join(' + ')}` : undefined;

    const progressPercent = progress
        ? Math.round((progress.sentTransactions / progress.totalTransactions) * 100)
        : 0;

    return (
        <SettingsPageLayout
            compact={compact}
            onBack={stage === 'sending' || stage === 'success' ? undefined : onBack}
            title={t('confirm_action')}
            subtitle={
                destination && (
                    <>
                        <span className="shrink-0">{t('migration_confirm_subtitle')}</span>
                        <WalletEmoji
                            emoji={destination.emoji}
                            emojiSize="14px"
                            containerSize="14px"
                        />
                        <span className="truncate">{destination.name}</span>
                    </>
                )
            }
        >
            <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col px-4 pb-4">
                {showError ? (
                    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                        <IcExclamationmarkCircle28 className="mb-4 size-14 text-accentOrange" />
                        <h2 className="text-h2 text-textPrimary">{t('error_occurred')}</h2>
                        <Button
                            variant="secondary"
                            size="medium"
                            className="mt-6"
                            onClick={onTryAgain}
                        >
                            {t('try_again')}
                        </Button>
                    </div>
                ) : !isReady ? (
                    <SkeletonScope loading>
                        <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                            {SKELETON_CONFIRM_ROWS.map((row, index) => (
                                <MigrationConfirmRow key={row.key} row={row} divider={index > 0} />
                            ))}
                        </div>
                    </SkeletonScope>
                ) : (
                    <>
                        <div className="overflow-hidden rounded-medium bg-backgroundContent">
                            {rows.map((row, index) => (
                                <MigrationConfirmRow key={row.key} row={row} divider={index > 0} />
                            ))}
                        </div>

                        {(showTonFee || showTronFee) && (
                            <div className="mt-2 overflow-hidden rounded-medium bg-backgroundContent">
                                {showTonFee && tonFee && (
                                    <MultichainDetailCell
                                        label={t('migration_confirm_ton_fee')}
                                        value={
                                            <NetworkFeeValue
                                                {...tonFee}
                                                onChange={
                                                    plan.canSwitch
                                                        ? () => setFeeSheet('ton')
                                                        : undefined
                                                }
                                            />
                                        }
                                        last={!showTronFee}
                                    />
                                )}
                                {showTronFee && tronFee && (
                                    <MultichainDetailCell
                                        label={t('migration_confirm_trc20_fee')}
                                        value={
                                            <NetworkFeeValue
                                                {...tronFee}
                                                onChange={
                                                    plan.tron.batteryCharges
                                                        ? () => setFeeSheet('tron')
                                                        : undefined
                                                }
                                            />
                                        }
                                        last
                                    />
                                )}
                            </div>
                        )}

                        {!plan.pending && plan.execution === 'tron-only' && (
                            <ShortageNote
                                title={t('migration_insufficient_ton_title')}
                                note={t('migration_only_tron_note')}
                                shortage={plan.tonShortage}
                            />
                        )}
                        {!plan.pending && plan.execution === 'ton-only' && (
                            <ShortageNote
                                title={t('migration_insufficient_trx_title')}
                                note={t('migration_only_ton_note')}
                            />
                        )}
                        {!plan.pending && plan.execution === 'blocked' && (
                            <ShortageNote
                                title={t('migration_insufficient_funds_title')}
                                shortage={plan.tonShortage}
                            />
                        )}

                        <div className="sticky bottom-0 mt-auto flex flex-col items-center gap-4 bg-backgroundPage pt-4">
                            {stage === 'idle' && !reviewedAll && (
                                <div className="pointer-events-none absolute inset-x-0 bottom-full flex justify-center bg-gradient-to-t from-backgroundPage to-transparent pt-4">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            endRef.current?.scrollIntoView({
                                                behavior: 'smooth',
                                                block: 'end'
                                            })
                                        }
                                        className="pointer-events-auto flex items-center gap-2 rounded-[18px] bg-buttonTertiaryBackground px-4 py-2 text-label2 text-buttonTertiaryForeground transition-colors duration-100 hover:bg-buttonTertiaryBackgroundHighlighted"
                                    >
                                        <IcArrowDown16 className="size-4" />
                                        {t('migration_confirm_scroll_hint')}
                                    </button>
                                </div>
                            )}
                            {stage === 'idle' && (
                                <Button
                                    variant="primaryBlue"
                                    size="large"
                                    fullWidth
                                    disabled={
                                        plan.pending || plan.execution === 'blocked' || !reviewedAll
                                    }
                                    onClick={onConfirm}
                                >
                                    {t('confirm')}
                                </Button>
                            )}
                            {stage === 'sending' && (
                                <div className="flex flex-col items-center gap-2 py-2">
                                    <Loader className="text-accentBlue" />
                                    <span className="text-label2 text-textPrimary">
                                        {t('migration_confirm_sending_transactions')}{' '}
                                        {progressPercent}%
                                    </span>
                                </div>
                            )}
                            {stage === 'success' && (
                                <div className="flex flex-col items-center gap-2 py-2 text-accentGreen">
                                    <IcCheckmarkCircle32 className="size-8" />
                                    <span className="text-label2">{t('send_done')}</span>
                                </div>
                            )}
                            {stage === 'failed' && (
                                <div className="flex flex-col items-center gap-2 py-2 text-accentRed">
                                    <IcExclamationmarkCircle28 className="size-8" />
                                    <span className="text-label2">{t('send_failed')}</span>
                                </div>
                            )}
                            {stage === 'retry' && (
                                <Button
                                    variant="primaryBlue"
                                    size="large"
                                    fullWidth
                                    leftIcon={<IcRefresh16 />}
                                    onClick={onTryAgain}
                                >
                                    {t('try_again')}
                                </Button>
                            )}
                            {stage === 'idle' && totalLabel && (
                                <button
                                    type="button"
                                    onClick={() => setHowItWorksOpen(true)}
                                    className="group flex items-center gap-1 px-4 text-body2 text-textSecondary"
                                >
                                    <span className="transition-colors duration-100 group-hover:text-textPrimary">
                                        {totalLabel}
                                    </span>
                                    <IcInformationCircle16 className="size-4 shrink-0 text-iconTertiary transition-colors duration-100 group-hover:text-iconSecondary" />
                                </button>
                            )}
                        </div>
                        <div ref={endRef} />

                        <SendFeeMethodSheet
                            isOpen={feeSheet === 'ton'}
                            onClose={() => setFeeSheet(undefined)}
                            selected={plan.method}
                            onSelect={method => selectFeeMethod(method, setFeeMethod)}
                            options={tonFeeOptions}
                        />
                        {tronFeeOptions.length > 0 && (
                            <SendFeeMethodSheet
                                isOpen={feeSheet === 'tron'}
                                onClose={() => setFeeSheet(undefined)}
                                selected={plan.tron.method}
                                onSelect={method => selectFeeMethod(method, setTronFeeMethod)}
                                options={tronFeeOptions}
                            />
                        )}
                        <MigrationHowItWorksSheet
                            isOpen={howItWorksOpen}
                            onClose={() => setHowItWorksOpen(false)}
                        />
                    </>
                )}
            </div>
        </SettingsPageLayout>
    );
};

const ShortageNote: FC<{
    title: string;
    note?: string;
    shortage?: { required: string; available: string };
}> = ({ title, note, shortage }) => {
    const { t } = useTranslation();
    const amounts =
        shortage &&
        formatMigrationShortage(
            new AssetAmount({ asset: TON_ASSET, weiAmount: shortage.required }),
            new AssetAmount({ asset: TON_ASSET, weiAmount: shortage.available })
        );
    return (
        <div className="mt-4 rounded-medium bg-backgroundContent p-4 text-body2">
            <div className="text-label2 text-accentOrange">{title}</div>
            {amounts && (
                <div className="mt-1 text-textSecondary">
                    {t('migration_insufficient_required', { amount: amounts.required })}{' '}
                    {t('migration_insufficient_balance', { amount: amounts.available })}
                </div>
            )}
            {note && <div className="mt-1 text-textSecondary">{note}</div>}
        </div>
    );
};
