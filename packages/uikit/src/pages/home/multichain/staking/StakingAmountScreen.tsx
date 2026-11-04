import { FC, ReactNode, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { CryptoCurrency } from '@tonkeeper/core/dist/entries/crypto';
import { BRAND_CONFIG } from '@tonkeeper/core/dist/config/brand';

import {
    formatAmount,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';
import { Button } from '../../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { cn } from '../../../../libs/css';
import { useAppContext } from '../../../../hooks/appContext';
import { useTranslation } from '../../../../hooks/translation';
import { useRate } from '../../../../state/rates';
import IcSwapVertical16 from '../../../../icons/components/IcSwapVertical16';
import { MultichainHint } from '../MultichainHint';

export interface StakingAmountScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Custom top-left control (the info button on the stake screen). */
    topBarLeft?: ReactNode;
    title: string;
    /** Balance shown in the "Available: …" label. */
    available: BigNumber | undefined;
    /** Value the MAX toggle fills in (may differ from `available` by a gas reserve). */
    maxAmount: BigNumber | undefined;
    /**
     * Validates the typed amount. A returned message replaces the
     * "Available: …" label in red and disables Continue (e.g. "Insufficient
     * balance", "Minimum deposit 50 GRAM."). Called only for amounts > 0.
     */
    getAmountError: (amount: BigNumber) => string | undefined;
    /** Explainer behind an info glyph next to the amount error (why the balance falls short). */
    getAmountErrorHint?: (amount: BigNumber) => string | undefined;
    /** Shown under the MAX row while MAX is on, when MAX holds part of the balance back. */
    maxHint?: string;
    /** Seed value when stepping back from the confirm screen. */
    initialAmount?: string;
    /**
     * The amount is fixed (TF pools allow full withdrawal only) — typing and
     * the MAX toggle are disabled.
     */
    readOnly?: boolean;
    /**
     * Content between the MAX row and the footer (pool cell, APY rows,
     * hints). The function form receives the live TON amount.
     */
    children?: ReactNode | ((tonAmount: BigNumber) => ReactNode);
    onContinue: (amount: BigNumber, isMax: boolean) => void;
    /** Continue shows a spinner while the transaction encodes. */
    continueLoading?: boolean;
}

/**
 * Hero amount-entry screen shared by the stake and unstake flows: the
 * centered amount card with a fiat-flip pill, the MAX toggle + available
 * balance row, and a Continue footer. The flow supplies everything below
 * the MAX row via `children`.
 */
export const StakingAmountScreen: FC<StakingAmountScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    topBarLeft,
    title,
    available,
    maxAmount,
    getAmountError,
    getAmountErrorHint,
    maxHint,
    initialAmount,
    readOnly,
    children,
    onContinue,
    continueLoading
}) => {
    const { t } = useTranslation();
    const { fiat } = useAppContext();
    const { data: tonRate } = useRate(CryptoCurrency.TON);
    const price = useMemo(
        () => (tonRate?.prices !== undefined ? new BigNumber(tonRate.prices) : undefined),
        [tonRate?.prices]
    );

    const [input, setInput] = useState(initialAmount ?? '');
    const [inFiat, setInFiat] = useState(false);
    const [isMax, setIsMax] = useState(false);
    // Flipping back without an edit restores the exact previous input;
    // reconverting each time would shrink the amount through the round-down.
    const [inputBeforeFlip, setInputBeforeFlip] = useState<string | undefined>();

    const parsedInput = new BigNumber(input || '0');
    const tonAmount = inFiat
        ? price && price.gt(0)
            ? parsedInput.div(price)
            : new BigNumber(0)
        : parsedInput;
    const converted = inFiat ? tonAmount : price ? tonAmount.multipliedBy(price) : undefined;

    const amountError = tonAmount.gt(0) ? getAmountError(tonAmount) : undefined;
    const amountErrorHint = amountError ? getAmountErrorHint?.(tonAmount) : undefined;
    const continueEnabled = tonAmount.gt(0) && !amountError;

    const onInputChange = (value: string) => {
        if (readOnly) return;
        if (value !== '' && !/^\d*([.,]\d*)?$/.test(value)) return;
        setIsMax(false);
        setInputBeforeFlip(undefined);
        setInput(fromAmountInput(value));
    };

    const onToggleMax = () => {
        if (!maxAmount || readOnly) return;
        if (isMax) {
            setIsMax(false);
            setInput('');
            return;
        }
        setInFiat(false);
        setInputBeforeFlip(undefined);
        setIsMax(true);
        setInput(maxAmount.decimalPlaces(9, BigNumber.ROUND_DOWN).toFixed());
    };

    const onToggleFiat = () => {
        if (!price || price.lte(0)) return;
        const n = new BigNumber(input || '0');
        if (n.gt(0)) {
            const next =
                inputBeforeFlip ??
                (inFiat
                    ? n.div(price).decimalPlaces(9, BigNumber.ROUND_DOWN).toFixed()
                    : n.multipliedBy(price).decimalPlaces(2, BigNumber.ROUND_DOWN).toFixed());
            setInputBeforeFlip(input);
            setInput(next);
        }
        setInFiat(v => !v);
    };

    const coinSymbol = BRAND_CONFIG.coinSymbol;
    const unit = inFiat ? fiat : coinSymbol;
    // The pill shows the converted value with a currency-code suffix
    // ("8,801.17 USD"), not the symbol-prefixed fiat format.
    const convertedText = `${formatAmount(converted ?? new BigNumber(0))} ${
        inFiat ? coinSymbol : fiat
    }`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarLeft={topBarLeft}
            topBarTitle={title}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col gap-4 pb-4">
                <div className="flex h-[188px] flex-col items-center justify-center gap-0 rounded-medium bg-backgroundContent px-4">
                    <div className="flex w-full max-w-full items-baseline justify-center gap-1.5 overflow-hidden">
                        <input
                            value={toAmountInput(input)}
                            onChange={e => onInputChange(e.target.value)}
                            type="text"
                            autoComplete="off"
                            inputMode="decimal"
                            placeholder="0"
                            autoFocus
                            readOnly={readOnly}
                            aria-label={title}
                            size={1}
                            className="[field-sizing:content] min-w-[1ch] max-w-full bg-transparent text-[40px] font-semibold leading-[48px] text-textPrimary outline-none placeholder:text-textPrimary"
                        />
                        <span className="shrink-0 text-[28px] font-semibold leading-9 text-textSecondary">
                            {unit}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleFiat}
                        disabled={!price || price.lte(0)}
                        className={cn(
                            'mt-2.5 flex max-w-full items-center gap-1 rounded-full border-[1.5px] border-buttonTertiaryBackground px-4 py-2 text-body1 text-textSecondary',
                            price && price.gt(0)
                                ? 'cursor-pointer transition-colors hover:border-buttonTertiaryBackgroundHighlighted'
                                : 'cursor-default'
                        )}
                    >
                        <span className="min-w-0 truncate">{convertedText}</span>
                        {price && price.gt(0) && <IcSwapVertical16 className="size-4 shrink-0" />}
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        variant={isMax ? 'primaryBlue' : 'secondary'}
                        size="small"
                        onClick={onToggleMax}
                        disabled={!maxAmount || maxAmount.lte(0) || readOnly}
                    >
                        {t('staking_max')}
                    </Button>
                    {amountError ? (
                        <span className="flex min-w-0 flex-1 items-center justify-end gap-1">
                            <span className="min-w-0 text-right text-body2 text-accentRed">
                                {amountError}
                            </span>
                            {amountErrorHint && (
                                <MultichainHint
                                    label={amountError}
                                    text={amountErrorHint}
                                    align="end"
                                />
                            )}
                        </span>
                    ) : (
                        <span className="flex-1 truncate text-right text-body2 text-textSecondary">
                            {t('staking_available_label')}:{' '}
                            {formatAmount(available ?? new BigNumber(0))} {coinSymbol}
                        </span>
                    )}
                </div>

                {isMax && maxHint && (
                    <p className="-mt-2 text-body2 text-textSecondary">{maxHint}</p>
                )}

                {typeof children === 'function' ? children(tonAmount) : children}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        disabled={!continueEnabled}
                        loading={continueLoading}
                        onClick={() => onContinue(tonAmount, isMax)}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
