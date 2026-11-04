import { FC, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';

import { MultichainWalletAsset } from '@tonkeeper/core/dist/service/multichainWalletService';
import { scannedSendForm } from '@tonkeeper/core/dist/service/multichainScannedTransfer';

import { Button, Input, TokenSwitch } from '../../../primitives';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../primitives/Modal';
import { cn } from '../../../libs/css';
import IcSwapVertical16 from '../../../icons/components/IcSwapVertical16';
import { useTranslation } from '../../../hooks/translation';
import { useAppContext } from '../../../hooks/appContext';
import {
    formatAmount,
    fromAmountInput,
    toAmountInput
} from '@tonkeeper/core/dist/utils/numberFormat';
import { formatFiatCurrency } from '../../../hooks/balance';
import { useScanner } from '../../../hooks/scanner';
import { useToast } from '../../../hooks/useNotification';
import {
    useChainAddressValidator,
    useEnsureChainKitReady
} from '../../../state/multichain/transfer/useMultichainTransfer';
import { useTonRecipientResolution } from '../../../state/multichain/transfer/useTonRecipientResolution';
import { parseAssetIdHead } from '../../../pages/home/multichain/multichain-utils';
import { SendAddressField } from './SendAddressField';
import { SendRecipientSuggestions } from './SendRecipientSuggestions';
import {
    MultichainSendState,
    networkLabel,
    networkStandardLabel,
    tokenSwitchIcons
} from './multichainSendShared';

export interface SendFormScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    asset: MultichainWalletAsset;
    /** Re-open the asset picker from the amount field's token pill. */
    onChangeToken: () => void;
    onContinue: (state: Omit<MultichainSendState, 'from'>) => void;
    /** Seed values when stepping back from the confirm screen. */
    initial?: Partial<Pick<MultichainSendState, 'toAddress' | 'amountDisplay' | 'comment'>>;
}

const FIAT_FRACTION_DIGITS = 2;

export const SendFormScreen: FC<SendFormScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    asset,
    onChangeToken,
    onContinue,
    initial
}) => {
    const { t } = useTranslation();
    const { fiat, hideQrScanner } = useAppContext();

    const chainKitReady = useEnsureChainKitReady();
    const validateAddress = useChainAddressValidator(asset.chain);

    const [address, setAddress] = useState(initial?.toAddress ?? '');
    const [amountInput, setAmountInput] = useState(initial?.amountDisplay ?? '');
    const [inFiat, setInFiat] = useState(false);
    const [isMax, setIsMax] = useState(false);
    const [comment, setComment] = useState(initial?.comment ?? '');

    const toast = useToast();
    const openScanner = useScanner(null, result => {
        const scanned = scannedSendForm(result, asset);
        if (scanned.kind !== 'form') {
            toast(scanned.kind === 'expired' ? t('send_link_expired') : t('Unexpected_QR_Code'));
            return;
        }
        setAddress(scanned.toAddress);
        setAddressTouched(true);
        if (scanned.comment && asset.chain === 'ton') setComment(scanned.comment);
        if (scanned.amountDisplay) {
            setInFiat(false);
            setIsMax(false);
            setAmountInput(scanned.amountDisplay);
        }
    });

    // The address error is surfaced once the field has been "touched" (lost
    // focus at least once) and stays put when the user focuses back in — it
    // clears only when they actually change the value. Gating on focus alone
    // made the error flicker away the moment they tapped back into the field.
    const [addressTouched, setAddressTouched] = useState(false);

    const onAddressChange = (value: string) => {
        setAddress(value);
        setAddressTouched(false);
    };

    const isTon = asset.chain === 'ton';
    const supportsComment = isTon;
    // TON recipients go through async tonapi resolution instead of the
    // synchronous chain-kit parse: it accepts name-service domains and
    // blocks backend-flagged scam accounts.
    const resolution = useTonRecipientResolution(isTon ? address : '');
    const price = asset.price;
    const balanceHuman = useMemo(
        () => new BigNumber(asset.balance).shiftedBy(-asset.decimals),
        [asset.balance, asset.decimals]
    );

    const parsedInput = new BigNumber(amountInput || '0');
    const cryptoHuman = inFiat
        ? price && price.gt(0)
            ? parsedInput.div(price)
            : new BigNumber(0)
        : parsedInput;
    const fiatValue = price ? cryptoHuman.multipliedBy(price) : undefined;

    // Until chain-kit finishes loading, `validateAddress` rejects everything
    // (its `Address` class isn't available yet), so treat validity as unknown
    // rather than invalid — never block or flag an address we can't yet check.
    const addressValid = isTon
        ? resolution.status === 'valid'
        : chainKitReady && address.trim() !== '' && validateAddress(address);
    const insufficient = cryptoHuman.gt(balanceHuman);
    const amountValid = cryptoHuman.gt(0) && !insufficient;
    // Some exchange deposit addresses reject transfers without a memo —
    // when tonapi flags the recipient, an empty comment blocks continue.
    const memoMissing =
        isTon && resolution.status === 'valid' && resolution.memoRequired && comment.trim() === '';
    const canContinue = addressValid && amountValid && !memoMissing;

    // Message for an address that isn't valid for the picked asset's network
    // (wrong format, or an address from a different chain). Names the expected
    // network + token standard so the user knows what to paste. Surfaced once
    // the field has been touched (and chain-kit can actually validate); it
    // persists across re-focus and clears only when the value changes. A
    // scam-flagged recipient surfaces immediately — no touch gating. A name
    // that doesn't resolve gets its own message: the format is fine, the
    // domain just isn't registered or has no wallet record.
    const invalidAddressMessage = () => {
        const std = networkStandardLabel(asset.assetId);
        const net = networkLabel(parseAssetIdHead(asset.assetId).network);
        return `${t('send_address_error')} ${
            std
                ? t('send_address_error_use_standard', { network: net, standard: std })
                : t('send_address_error_use', { network: net })
        }`;
    };
    const addressError = isTon
        ? resolution.status === 'scam'
            ? t('send_address_blacklisted')
            : addressTouched && resolution.status === 'not_found'
            ? t('send_address_domain_not_found')
            : addressTouched && resolution.status === 'invalid'
            ? invalidAddressMessage()
            : undefined
        : chainKitReady && addressTouched && address.trim() !== '' && !addressValid
        ? invalidAddressMessage()
        : undefined;

    // Fiat amounts carry cents; crypto amounts can't exceed the asset's
    // on-chain precision, or the smallest-unit conversion would truncate.
    const maxFractionDigits = inFiat ? FIAT_FRACTION_DIGITS : asset.decimals;

    const onAmountChange = (value: string) => {
        if (value !== '' && !/^\d*([.,]\d*)?$/.test(value)) return;
        const fraction = value.split(/[.,]/)[1];
        if (fraction !== undefined && fraction.length > maxFractionDigits) return;
        setIsMax(false);
        setAmountInput(fromAmountInput(value));
    };

    const onMax = () => {
        setInFiat(false);
        setIsMax(true);
        setAmountInput(balanceHuman.toFixed());
    };

    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) onAddressChange(text.trim());
        } catch {
            /* clipboard unavailable / denied */
        }
    };

    const onToggleFiat = () => {
        if (!price || price.lte(0)) return;
        // Carry the typed value across the unit flip so the amount doesn't jump.
        setAmountInput(prev => {
            const n = new BigNumber(prev || '0');
            if (n.lte(0)) return prev;
            return inFiat
                ? n.div(price).decimalPlaces(asset.decimals, BigNumber.ROUND_DOWN).toFixed()
                : n
                      .multipliedBy(price)
                      .decimalPlaces(FIAT_FRACTION_DIGITS, BigNumber.ROUND_DOWN)
                      .toFixed();
        });
        setInFiat(v => !v);
    };

    const submit = () => {
        if (!canContinue) return;
        onContinue({
            asset,
            toAddress:
                isTon && resolution.status === 'valid' ? resolution.toAddress : address.trim(),
            toDomain: isTon && resolution.status === 'valid' ? resolution.domain : undefined,
            amount: BigInt(
                cryptoHuman.shiftedBy(asset.decimals).integerValue(BigNumber.ROUND_FLOOR).toFixed()
            ),
            amountDisplay: cryptoHuman.toFixed(),
            isMax,
            comment: supportsComment && comment.trim() ? comment.trim() : undefined
        });
    };

    const { icon, chainBadge } = tokenSwitchIcons(asset);
    const secondary = inFiat
        ? formatAmount(cryptoHuman, { unit: asset.symbol })
        : fiatValue
        ? formatFiatCurrency(fiat, fiatValue)
        : formatFiatCurrency(fiat, 0);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            topBarTitle={t('send_title')}
            variant="content"
            mobileHeight="full"
        >
            <div className="flex flex-col gap-4 pb-4">
                <SendAddressField
                    value={address}
                    onChange={onAddressChange}
                    onClear={() => onAddressChange('')}
                    onPaste={onPaste}
                    onBlur={() => setAddressTouched(true)}
                    // QR scan is only wired on the native mobile shell; the
                    // desktop/web/extension shells set `hideQrScanner`.
                    onScan={hideQrScanner ? undefined : openScanner}
                    error={addressError}
                />

                {address.trim() === '' && (
                    <SendRecipientSuggestions chain={asset.chain} onSelect={onAddressChange} />
                )}

                <div className="flex flex-col">
                    <label
                        htmlFor="send-amount"
                        className={cn(
                            'flex h-16 cursor-text items-center gap-2 rounded-medium border-[1.5px] px-4 transition-colors',
                            insufficient
                                ? 'border-fieldErrorBorder bg-fieldErrorBackground'
                                : 'border-transparent bg-fieldBackground focus-within:border-fieldActiveBorder'
                        )}
                    >
                        <div className="flex min-w-0 flex-1 flex-col">
                            <span
                                className={cn(
                                    'text-body3',
                                    insufficient ? 'text-fieldErrorBorder' : 'text-textSecondary'
                                )}
                            >
                                {t('send_amount')}
                            </span>
                            <input
                                id="send-amount"
                                value={toAmountInput(amountInput)}
                                onChange={e => onAmountChange(e.target.value)}
                                type="text"
                                autoComplete="off"
                                inputMode="decimal"
                                placeholder="0"
                                aria-label={t('send_amount')}
                                className="w-full bg-transparent text-body1 font-medium text-textPrimary outline-none placeholder:text-textSecondary"
                            />
                        </div>
                        <TokenSwitch
                            icon={icon}
                            chainBadge={chainBadge}
                            symbol={asset.symbol}
                            onClick={onChangeToken}
                        />
                    </label>
                    <div className="flex items-center justify-between gap-2 px-0.5 pt-3 text-body2 text-textSecondary">
                        {insufficient ? (
                            <span className="min-w-0 truncate text-fieldErrorBorder">
                                {t('confirm_error_insufficient_balance_light')}
                            </span>
                        ) : (
                            <button
                                type="button"
                                onClick={onToggleFiat}
                                disabled={!price || price.lte(0)}
                                className={cn(
                                    'flex min-w-0 items-center gap-1',
                                    price && price.gt(0) ? 'cursor-pointer' : 'cursor-default'
                                )}
                            >
                                <span className="min-w-0 truncate">{secondary}</span>
                                {price && price.gt(0) && (
                                    <IcSwapVertical16 className="h-4 w-4 shrink-0" />
                                )}
                            </button>
                        )}
                        <div className="flex shrink-0 items-center gap-1 whitespace-nowrap text-right">
                            {/* Full precision, because MAX inserts exactly this value —
                                a rounded label reads as insufficient balance next to it. */}
                            <span>
                                {t('send_balance')}:{' '}
                                {formatAmount(balanceHuman, { unit: asset.symbol, exact: true })}
                            </span>
                            <button type="button" onClick={onMax} className="text-textAccent">
                                {t('send_max')}
                            </button>
                        </div>
                    </div>
                </div>

                {supportsComment && (
                    <div className="flex flex-col">
                        <Input
                            id="send-comment"
                            value={comment}
                            onChange={setComment}
                            label={t('send_comment')}
                        />
                        {comment.trim() !== '' && (
                            <p className="px-0.5 pt-2 text-body2 text-textSecondary">
                                {t('send_comment_visible_hint')}
                            </p>
                        )}
                    </div>
                )}
            </div>

            <ModalFooterPortal>
                <ModalFooter>
                    <Button
                        variant="primaryBlue"
                        size="large"
                        fullWidth
                        disabled={!canContinue}
                        onClick={submit}
                    >
                        {t('continue')}
                    </Button>
                </ModalFooter>
            </ModalFooterPortal>
        </Modal>
    );
};
