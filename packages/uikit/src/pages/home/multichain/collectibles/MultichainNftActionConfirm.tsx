import { FC, ReactNode, useEffect, useState } from 'react';
import { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

import { AssetAmount } from '@tonkeeper/core/dist/entries/crypto/asset/asset-amount';
import {
    TransactionFeeBattery,
    TransactionFeeTonAsset,
    isTransactionFeeRefund
} from '@tonkeeper/core/dist/entries/crypto/transaction-fee';
import { TonEstimation } from '@tonkeeper/core/dist/entries/send';
import { UserCancelledError } from '@tonkeeper/core/dist/errors/UserCancelledError';
import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';

import { Button } from '../../../../primitives';
import { ConfirmActionResult } from '../../../../components/shared/ConfirmActionResult';
import { Modal, ModalFooter, ModalFooterPortal } from '../../../../primitives/Modal';
import { WalletEmoji } from '../../../../components/shared/emoji/WalletEmoji';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { useAppContext } from '../../../../hooks/appContext';
import { useAppSdk } from '../../../../hooks/appSdk';
import { formatFiatCurrency } from '../../../../hooks/balance';
import { useTranslation } from '../../../../hooks/translation';
import { useAssetAmountFiatEquivalent } from '../../../../state/asset';
import { formatAmount, formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

/**
 * Body of an NFT action confirm sheet: item art, "Confirm action" + title,
 * a details table, and the action slot pinned to the footer. Pure — every
 * value is a prop, so it renders identically in a screenshot as in the app.
 */
export const NftActionConfirmView: FC<{
    title: string;
    image?: string;
    imageAlt?: string;
    rows: ReactNode;
    error?: string;
    action: ReactNode;
}> = ({ title, image, imageAlt, rows, error, action }) => {
    const { t } = useTranslation();

    return (
        <div className="flex min-h-full flex-col">
            <div className="flex flex-col items-center pb-8 pt-2">
                <div className="pb-5">
                    <div className="size-24 overflow-hidden rounded-medium bg-backgroundContentTint">
                        {image && (
                            <img
                                src={image}
                                alt={imageAlt ?? ''}
                                className="h-full w-full object-cover"
                            />
                        )}
                    </div>
                </div>
                <p className="text-body1 text-textSecondary">{t('send_confirm_action')}</p>
                <p className="text-h3 text-textPrimary">{title}</p>
            </div>

            <div className="overflow-hidden rounded-medium bg-backgroundContent">{rows}</div>

            {error && <p className="px-1 pt-3 text-center text-body2 text-accentRed">{error}</p>}

            <ModalFooterPortal>
                <ModalFooter>{action}</ModalFooter>
            </ModalFooterPortal>
        </div>
    );
};

export const NftActionWalletCell: FC<{ emoji?: string; name: string }> = ({ emoji, name }) => {
    const { t } = useTranslation();
    return (
        <MultichainDetailCell
            label={t('send_confirm_wallet')}
            value={
                <span className="inline-flex max-w-full items-center justify-end gap-1.5">
                    <WalletEmoji emoji={emoji} emojiSize="16px" containerSize="16px" />
                    <span className="truncate">{name}</span>
                </span>
            }
        />
    );
};

export const FeeText: FC<{ fee: TransactionFeeTonAsset | TransactionFeeBattery }> = ({ fee }) => {
    const { t } = useTranslation();
    if (fee.type === 'battery') {
        return <>{t('battery_n_battery_charges', { charges: formatCount(fee.charges) })}</>;
    }
    const amount = formatAmount(fee.extra.relativeAmount.abs(), { unit: fee.extra.stringAsset });
    return <>{isTransactionFeeRefund(fee) ? amount : `≈ ${amount}`}</>;
};

export const FeeFiatSub: FC<{ extra: AssetAmount }> = ({ extra }) => {
    const { fiat } = useAppContext();
    const { data: fiatAmount } = useAssetAmountFiatEquivalent(extra);
    if (!fiatAmount) return null;
    return <>≈ {formatFiatCurrency(fiat, fiatAmount.abs())}</>;
};

/** The fee row of an NFT action, fed straight from its estimation query. */
export const NftActionFeeCell: FC<{ estimation: UseQueryResult<TonEstimation, Error> }> = ({
    estimation
}) => {
    const { t } = useTranslation();
    const fee = estimation.data?.fee;
    return (
        <MultichainDetailCell
            label={t('transaction_fee')}
            value={fee ? <FeeText fee={fee} /> : estimation.isError ? '—' : '…'}
            sub={fee?.type === 'ton-asset' ? <FeeFiatSub extra={fee.extra} /> : undefined}
            last
        />
    );
};

/**
 * Confirm sheet shared by the NFT actions (renew, link, unlink, transfer).
 * Owns the send lifecycle: maps a failure to an inline error, hands the
 * Done state to the confirm control, and closes with `confirmed` shortly
 * after success so the caller can start polling for the on-chain change.
 * `rows` and `title` are the caller's — the sheet only knows the wallet
 * signs a TON message.
 */
export const NftActionConfirmSheet: FC<{
    isOpen: boolean;
    onClose: (confirmed?: boolean) => void;
    title: string;
    image?: string;
    imageAlt?: string;
    rows: ReactNode;
    /** Gates the confirm control: it stays disabled until the action is priced. */
    estimation: Pick<UseQueryResult<TonEstimation, Error>, 'isFetching' | 'isError' | 'data'>;
    mutation: UseMutationResult<boolean, Error, void>;
    /** Label of the confirm control; defaults to `title`. */
    confirmLabel?: string;
    /** Route the sheet back instead of closing, e.g. to a recipient step. */
    onBack?: () => void;
    /** Sheets that stack over the confirm, e.g. the fee-method picker. */
    children?: ReactNode;
}> = ({
    isOpen,
    onClose,
    title,
    image,
    imageAlt,
    rows,
    estimation,
    mutation,
    confirmLabel,
    onBack,
    children
}) => {
    const { t } = useTranslation();
    const sdk = useAppSdk();

    const [sendError, setSendError] = useState<string | undefined>();

    useEffect(() => {
        if (!mutation.isSuccess) return undefined;
        const handle = window.setTimeout(() => onClose(true), 1800);
        return () => window.clearTimeout(handle);
    }, [mutation.isSuccess, onClose]);

    const onConfirm = async () => {
        setSendError(undefined);
        try {
            await mutation.mutateAsync();
            sdk.hapticNotification('success');
        } catch (e) {
            sdk.hapticNotification('error');
            setSendError(
                e instanceof UserCancelledError || (e as Error)?.message === 'Cancel auth request'
                    ? t('transaction_cancelled')
                    : getErrorText(e, { t })
            );
        }
    };

    const status = mutation.isLoading ? 'loading' : mutation.isSuccess ? 'done' : 'idle';
    const confirmDisabled = estimation.isFetching || estimation.isError || !estimation.data;
    const label = confirmLabel ?? title;

    const action =
        status === 'done' ? (
            <ConfirmActionResult variant="done" label={t('send_done')} />
        ) : (
            <Button
                variant="primaryBlue"
                size="large"
                fullWidth
                loading={mutation.isLoading}
                disabled={confirmDisabled}
                onClick={onConfirm}
            >
                {label}
            </Button>
        );

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => onClose()}
            onBack={onBack}
            afterClose={() => setSendError(undefined)}
            variant="content"
        >
            <NftActionConfirmView
                title={title}
                image={image}
                imageAlt={imageAlt}
                rows={rows}
                error={sendError}
                action={action}
            />
            {children}
        </Modal>
    );
};
