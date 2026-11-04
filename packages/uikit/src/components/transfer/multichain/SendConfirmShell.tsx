import { FC, ReactNode, useEffect, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { TON_ASSET } from '@tonkeeper/core/dist/entries/crypto/asset/constants';
import { TransactionFee } from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import { FiatCurrencies } from '@tonkeeper/core/dist/entries/fiat';
import { formatAmount } from '@tonkeeper/core/dist/utils/numberFormat';

import { Button, Loader } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useNavigate } from '../../../hooks/router/useNavigate';
import {
    MULTICHAIN_ACTION_ADD_FUNDS,
    MULTICHAIN_ACTION_ASSET_PARAM,
    MULTICHAIN_ACTION_FROM_PARAM,
    MULTICHAIN_ACTION_PARAM,
    MultichainRoute
} from '../../../libs/routes';
import type { RampSource } from '../../../hooks/analytics/ramp-flow';
import { toAnalyticsFeeAsset } from '../../../hooks/analytics/events-hooks';
import {
    SendFeeAsset,
    toMultichainSendContext,
    useSendAnalytics,
    useSendEmulationAnalytics
} from '../../../hooks/analytics/send';
import { AllChainsSenderType } from '../../../hooks/blockchain/sender/sender-type';
import { useActiveAccount } from '../../../state/wallet';
import { useBatteryUnitTonRate } from '../../../state/battery';
import { useMultichainWalletAssets } from '../../../state/multichain/useMultichainWalletAssets';
import { useSendFailureText } from '../../../state/multichain/transfer/useSendFailureText';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { ConfirmActionResult } from '../../shared/ConfirmActionResult';
import { InsufficientFundsSheet } from './InsufficientFundsSheet';
import { NetworkFeeValue } from './NetworkFeeValue';
import { SendConfirmView } from './SendConfirmView';
import { SendFeeMethodSheet } from './SendFeeMethodSheet';
import { BatteryModal } from '../../../pages/home/multichain/battery/BatteryModal';
import { MultichainSendState } from './multichainSendShared';

export interface SendConfirmScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Runs when the done state finishes, right before the flow closes. */
    onSent?: () => void;
    state: MultichainSendState;
}

export interface Shortfall {
    required: string;
    balance: string;
    buySymbol: string;
    buyAssetId: string;
}

/** The send mutation as the shell sees it — any `useMutation` result fits. */
export interface ShellSend {
    isLoading: boolean;
    isSuccess: boolean;
    isError: boolean;
    error: Error | null;
    reset: () => void;
}

/** Fiat text for `amount` of an asset priced in fiat, or undefined without a rate. */
export const fiatOf = (
    fiat: FiatCurrencies,
    amount: BigNumber | undefined,
    price: BigNumber | undefined
): string | undefined =>
    amount && price ? formatFiatCurrency(fiat, amount.multipliedBy(price)) : undefined;

/** The chain's native coin row of the wallet: rate for fiat fees, balance for the sufficiency check. */
/**
 * The chain coin that pays `network`'s fees. Matched on the asset type, not
 * `isNativeRow`: ETH on Base and Arbitrum is drawn as a borrowed coin, yet it
 * is still the coin those chains charge gas in. `undefined` when the wallet
 * lists none, which at a zero balance is the usual case.
 */
export const useNativeAsset = (network: string): MultichainWalletAsset | undefined => {
    const { data: assetsData } = useMultichainWalletAssets();
    return useMemo(
        () =>
            (assetsData?.assets ?? []).find(a => {
                const head = parseAssetIdHead(a.assetId);
                return head.type === 'coin' && head.network === network;
            }),
        [assetsData, network]
    );
};

/**
 * Leaves the send flow for the home's add-funds flow of a chain coin; unlike
 * the battery sheet it doesn't stack over the confirm, so the typed transfer
 * is lost. `from` is the ramp source the top-up reports; the home falls back
 * to the wallet screen without one.
 */
export const useLeaveForAddFunds = (onClose: () => void, from?: RampSource) => {
    const navigate = useNavigate();
    return (assetId: string) => {
        onClose();
        const params = new URLSearchParams({
            [MULTICHAIN_ACTION_PARAM]: MULTICHAIN_ACTION_ADD_FUNDS,
            [MULTICHAIN_ACTION_ASSET_PARAM]: assetId
        });
        if (from) params.set(MULTICHAIN_ACTION_FROM_PARAM, from);
        navigate(`${MultichainRoute.home}?${params.toString()}`);
    };
};

/**
 * The confirm shell shared by every send path: the details table, the
 * confirm button with its loading → done → error lifecycle, and the
 * insufficient-funds sheet. The paths differ only in how they price and
 * broadcast, so those come in as props.
 */
export const SendConfirmShell: FC<
    SendConfirmScreenProps & {
        /**
         * What the transfer moves, when it differs from what was entered:
         * a MAX coin send net of its fee.
         */
        amountDisplay?: string;
        feeLabel: string;
        fee: ReactNode;
        feeSub?: string;
        feeLoading: boolean;
        feeError: boolean;
        /** Whether a fee estimate is in flight, when that differs from `feeLoading`. */
        estimating?: boolean;
        estimateError?: unknown;
        feeAsset: SendFeeAsset;
        shortfall: Shortfall | undefined;
        send: ShellSend;
        canSend: boolean;
        onSend: () => void;
        children?: ReactNode;
    }
> = ({
    isOpen,
    onClose,
    onBack,
    onSent,
    state,
    amountDisplay = state.amountDisplay,
    feeLabel,
    fee,
    feeSub,
    feeLoading,
    feeError,
    estimating = feeLoading,
    estimateError,
    feeAsset,
    shortfall,
    send,
    canSend,
    onSend,
    children
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const account = useActiveAccount();
    const addFunds = useLeaveForAddFunds(onClose, state.from);
    const sendFailureText = useSendFailureText();

    const analyticsContext = useMemo(
        () =>
            toMultichainSendContext({
                from: state.from,
                assetId: state.asset.assetId,
                amount: state.amount,
                decimals: state.asset.decimals
            }),
        [state]
    );
    useSendEmulationAnalytics({
        context: analyticsContext,
        active: isOpen,
        pending: estimating,
        failed: feeError,
        error: estimateError
    });
    const sendAnalytics = useSendAnalytics(analyticsContext);
    const { succeed: trackSendSuccess, fail: trackSendFailed } = sendAnalytics;
    useEffect(() => {
        if (send.isSuccess) trackSendSuccess();
        else if (send.isError) trackSendFailed(send.error);
    }, [send.isSuccess, send.isError, send.error, trackSendSuccess, trackSendFailed]);

    const { asset } = state;
    // No back while the transfer is in-flight or done.
    const backHandler = send.isLoading || send.isSuccess ? undefined : onBack;

    const amountFiat = fiatOf(fiat, new BigNumber(amountDisplay), asset.price);

    // A failure flashes the red error state for 2s, then swaps the confirm
    // affordance for a "Try Again" button. A user-cancelled unlock is not a
    // failure — the mutation resets and the idle confirm control returns.
    const [errorPhase, setErrorPhase] = useState<'flash' | 'retry' | undefined>();
    useEffect(() => {
        if (!send.isError) {
            setErrorPhase(undefined);
            return undefined;
        }
        if (
            send.error instanceof UserCancelledError ||
            send.error?.message === 'Cancel auth request'
        ) {
            send.reset();
            return undefined;
        }
        setErrorPhase('flash');
        const handle = window.setTimeout(() => setErrorPhase('retry'), 2000);
        return () => window.clearTimeout(handle);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [send.isError, send.error]);

    const status = send.isLoading
        ? 'loading'
        : send.isSuccess
        ? 'done'
        : errorPhase === 'flash'
        ? 'error'
        : 'idle';

    useEffect(() => {
        if (!send.isSuccess) return undefined;
        const handle = window.setTimeout(() => {
            onSent?.();
            onClose();
        }, 1800);
        return () => window.clearTimeout(handle);
    }, [send.isSuccess, onSent, onClose]);

    const onConfirm = () => {
        if (!canSend || shortfall) return;
        sendAnalytics.confirm(feeAsset);
        onSend();
    };

    const onRetry = () => {
        send.reset();
        onConfirm();
    };

    const onBuyMissingFunds = () => {
        if (shortfall) addFunds(shortfall.buyAssetId);
    };

    const disabled = !canSend || feeLoading || !!shortfall;

    const action =
        errorPhase === 'retry' ? (
            <Button variant="primaryBlue" size="large" fullWidth onClick={onRetry}>
                {t('try_again')}
            </Button>
        ) : status === 'done' ? (
            <ConfirmActionResult variant="done" label={t('send_done')} />
        ) : status === 'error' ? (
            <ConfirmActionResult variant="error" label={t('send_failed')} />
        ) : (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={send.isLoading}
                disabled={disabled}
                onClick={onConfirm}
            >
                {t('confirm')}
            </Button>
        );

    return (
        <Modal isOpen={isOpen} onClose={onClose} onBack={backHandler} variant="content">
            <SendConfirmView
                asset={asset}
                accountName={account.name}
                toAddress={state.toAddress}
                toDomain={state.toDomain}
                amountDisplay={amountDisplay}
                amountFiat={amountFiat}
                comment={state.comment}
                feeLabel={feeLabel}
                fee={fee}
                feeSub={feeSub}
                feeError={feeError}
                sendError={errorPhase ? sendFailureText(send.error) : undefined}
                action={action}
            />
            {/* Dismissing pops back to the form so the user can lower the
                amount, matching the native dialog. The failed send is
                cleared too, so a shortage the chain reported doesn't reopen
                the sheet over the next attempt. */}
            {shortfall && (
                <InsufficientFundsSheet
                    isOpen={isOpen && !send.isLoading && !send.isSuccess}
                    onClose={() => {
                        send.reset();
                        (onBack ?? onClose)();
                    }}
                    required={shortfall.required}
                    balance={shortfall.balance}
                    buySymbol={shortfall.buySymbol}
                    onBuy={onBuyMissingFunds}
                />
            )}
            {children}
        </Modal>
    );
};

export interface FeeTextParts {
    /** Fee in its own unit: "0.00115 TON", "2 charges". */
    amount: string;
    fiatText?: string;
    /** The paying currency or method, for the "· unit" suffix: "TON", "Battery". */
    unit: string;
    /**
     * The picker-mode row: fiat with the currency for coin-paid fees
     * ("≈ $0.0015 · TON"), charges for battery ("≈ 2 charges · Battery"),
     * the bare amount when there is no rate.
     */
    row: { value: string; unit?: string };
}

/**
 * Formats a relayed-path fee for the row and the picker. Fiat comes from the
 * wallet's native-coin rows (TON for the coin and battery, TRX for TRX) and
 * from `jettonPrice` when the fee is paid in the sent jetton itself.
 */
export const useFeeTextFormatter = (jetton?: { id: string; price?: BigNumber }) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const batteryUnitTonRate = useBatteryUnitTonRate();
    const tonPrice = useNativeAsset('ton')?.price;
    const trxPrice = useNativeAsset('tron')?.price;

    const coinFee = (extra: AssetAmount, price: BigNumber | undefined): FeeTextParts => {
        const amount = formatAmount(extra.relativeAmount.abs(), { unit: extra.stringAsset });
        const fiatText = fiatOf(fiat, extra.relativeAmount.abs(), price);
        return {
            amount,
            fiatText,
            unit: extra.asset.symbol,
            row: fiatText ? { value: fiatText, unit: extra.asset.symbol } : { value: amount }
        };
    };

    /**
     * `emulatedTonWei` is the battery emulation's own TON cost; when given,
     * the fiat follows it rather than the charges, which round up to whole
     * charges and overstate the fee.
     */
    return (fee: TransactionFee, emulatedTonWei?: number): FeeTextParts => {
        switch (fee.type) {
            case 'battery':
                return {
                    amount: t('send_fee_charges', { count: fee.charges }),
                    fiatText: fiatOf(
                        fiat,
                        emulatedTonWei === undefined
                            ? batteryUnitTonRate.multipliedBy(fee.charges)
                            : new BigNumber(emulatedTonWei).abs().shiftedBy(-TON_ASSET.decimals),
                        tonPrice
                    ),
                    unit: t('send_fee_battery'),
                    row: {
                        value: t('send_fee_charges', { count: fee.charges }),
                        unit: t('send_fee_battery')
                    }
                };
            case 'ton-asset':
            case 'ton-asset-relayed': {
                const price =
                    fee.extra.asset.id === TON_ASSET.id
                        ? tonPrice
                        : fee.extra.asset.id === jetton?.id
                        ? jetton.price
                        : undefined;
                return coinFee(fee.extra, price);
            }
            case 'tron-asset':
                return coinFee(fee.extra, trxPrice);
            case 'free-transfer':
                return { amount: '—', unit: '', row: { value: '—' } };
        }
    };
};

/** One fee method as the picker-mode confirm screen sees it, whatever chain prices it. */
export interface FeeMethodEstimate<K extends string> {
    key: K;
    /** Picker row title — the paying asset's symbol or the battery's name. */
    title: string;
    /** 44px picker row icon. */
    icon: ReactNode;
    fee: TransactionFee | undefined;
    isLoading: boolean;
    isError: boolean;
    /** The paying balance can't cover this method right now. */
    insufficient: boolean;
    refetch: () => void;
    /**
     * What tops up this method's paying balance: the battery, or the chain
     * coin's backend asset id for the add-funds flow. Omitted when nothing
     * can (a gasless fee that exceeds the amount).
     */
    topUp?: 'battery' | { assetId: string };
}

/**
 * Confirm screen for the relayed paths (TON jettons, TRON USD₮): several
 * fee methods priced side by side, the native apps' "Network fee → Choose
 * method" picker when more than one is listed, and the plain two-line fee
 * row when only one is. The user's explicit pick wins; until then
 * `pickDefault` applies and may move as estimates land.
 */
export const RelayedSendConfirm = <K extends AllChainsSenderType>({
    estimates,
    methodsLoading,
    pickDefault,
    send,
    canSend,
    onSend,
    shortfallFor,
    jetton,
    ...props
}: SendConfirmScreenProps & {
    estimates: FeeMethodEstimate<K>[];
    methodsLoading: boolean;
    pickDefault: (estimates: FeeMethodEstimate<K>[]) => K | undefined;
    send: ShellSend;
    canSend: (selected: FeeMethodEstimate<K>) => boolean;
    onSend: (selected: FeeMethodEstimate<K>) => void;
    shortfallFor?: (selected: FeeMethodEstimate<K>) => Shortfall | undefined;
    /** The sent jetton, when the fee can be paid in it. */
    jetton?: { id: string; price?: BigNumber };
}) => {
    const { t } = useTranslation();
    const feeText = useFeeTextFormatter(jetton);
    const addFunds = useLeaveForAddFunds(props.onClose, props.state.from);
    // The battery screen stacks over the confirm as a second layer, so the
    // typed transfer survives a recharge; the estimates re-price on return.
    const [batteryOpen, setBatteryOpen] = useState(false);

    // A method that fails to price leaves the picker, as on iOS — a manual
    // pick of it falls back to the default rather than stranding the user on
    // an unusable method. Only when every method failed is the failure shown
    // on the row, with a retry that re-prices them all.
    const usable = estimates.filter(e => !e.isError && (e.fee || e.insufficient));
    const pending = methodsLoading || estimates.some(e => e.isLoading);
    const allFailed = !pending && estimates.length > 0 && usable.length === 0;

    // The default is chosen once, after every method has been priced — the
    // row shows the loader until then rather than hopping between methods as
    // estimates land. A manual pick sticks; the default is re-chosen only if
    // the current method drops out of the list.
    const [selectedKey, setSelectedKey] = useState<K>();
    const usableSignature = usable.map(e => `${e.key}:${e.insufficient}`).join('|');
    useEffect(() => {
        if (pending) return;
        if (selectedKey && usable.some(e => e.key === selectedKey)) return;
        setSelectedKey(pickDefault(usable));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pending, usableSignature, selectedKey]);
    const selected = pending ? undefined : usable.find(e => e.key === selectedKey);

    const [sheetOpen, setSheetOpen] = useState(false);
    const canPick = usable.length > 1;
    // As on iOS, opening the picker re-prices the methods that failed to
    // price, so a transient failure only hides a method until the next open.
    const openPicker = () => {
        estimates.filter(e => e.isError).forEach(e => e.refetch());
        setSheetOpen(true);
    };

    const priced = selected?.fee ? feeText(selected.fee) : undefined;
    const feeLoading = !allFailed && (pending || !selected);

    // In picker mode the value line carries the fiat and the method name
    // ("≈ $0.0015 · TON"), so there is no sub line; with a single method the
    // row is the plain two-line amount + fiat like every other chain.
    const fee = (
        <NetworkFeeValue
            loading={feeLoading}
            error={allFailed}
            onRetry={() => estimates.forEach(e => e.refetch())}
            value={priced ? (canPick ? priced.row.value : priced.amount) : undefined}
            unit={canPick ? priced?.row.unit : undefined}
            onChange={canPick ? openPicker : undefined}
        />
    );

    const topUpAction = (estimate: FeeMethodEstimate<K>) => {
        if (!estimate.insufficient || !estimate.topUp) return undefined;
        if (estimate.topUp === 'battery') {
            return {
                label: t('battery_recharge_by_crypto_title'),
                onClick: () => setBatteryOpen(true)
            };
        }
        const { assetId } = estimate.topUp;
        return { label: t('wallet_add_funds'), onClick: () => addFunds(assetId) };
    };

    const options = usable.map(estimate => {
        const parts = estimate.fee ? feeText(estimate.fee) : undefined;
        return {
            key: estimate.key,
            icon: estimate.icon,
            title: estimate.title,
            action: topUpAction(estimate),
            subtitle:
                !parts && estimate.insufficient ? (
                    t('send_screen_steps_amount_insufficient_balance')
                ) : !parts ? (
                    <Loader size="xSmall" />
                ) : parts.fiatText ? (
                    `≈ ${parts.fiatText} (${parts.amount})`
                ) : (
                    `≈ ${parts.amount}`
                ),
            disabled: estimate.insufficient
        };
    });

    return (
        <SendConfirmShell
            {...props}
            feeLabel={canPick ? t('send_network_fee') : t('transaction_fee')}
            fee={fee}
            feeSub={canPick ? undefined : priced?.fiatText}
            feeLoading={feeLoading}
            feeError={allFailed}
            estimating={pending}
            feeAsset={selected ? toAnalyticsFeeAsset(selected.key) : 'coin'}
            shortfall={selected && shortfallFor ? shortfallFor(selected) : undefined}
            send={send}
            canSend={!!selected?.fee && !selected.insufficient && canSend(selected)}
            onSend={() => selected && onSend(selected)}
        >
            <SendFeeMethodSheet
                isOpen={props.isOpen && sheetOpen}
                onClose={() => setSheetOpen(false)}
                options={options}
                selected={selectedKey}
                onSelect={setSelectedKey}
            />
            <BatteryModal
                isOpen={props.isOpen && batteryOpen}
                onClose={() => setBatteryOpen(false)}
                afterClose={() => estimates.forEach(e => e.refetch())}
                from="wallet"
                layered
            />
        </SendConfirmShell>
    );
};
