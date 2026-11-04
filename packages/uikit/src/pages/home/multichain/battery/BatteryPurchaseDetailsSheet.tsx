import { FC, useState } from 'react';

import { getErrorText } from '@tonkeeper/core/dist/errors/TranslatableError';

import { Button } from '../../../../primitives';
import { Modal } from '../../../../primitives/Modal';
import { useTranslation } from '../../../../hooks/translation';
import IcDonemarkOutline28 from '../../../../icons/components/IcDonemarkOutline28';
import {
    BatteryPurchase,
    BatteryPurchaseValue,
    useRequestBatteryRefund
} from '../../../../state/battery';
import { formatHistoryDateTime } from '../history/multichain-history-utils';
import { MultichainDetailCell } from '../MultichainDetailCell';
import { formatBatteryAmount, isGiftOnTheWay, purchaseTypeLabelKey } from './battery-history-utils';
import { formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

export interface BatteryPurchaseDetailsSheetViewProps {
    isOpen: boolean;
    onClose: () => void;
    purchase: BatteryPurchase;
    refunding?: boolean;
    /**
     * The part just requested back. Set once the request went through: the
     * sheet then shows the settlement notice instead of the action.
     */
    refunded?: BatteryPurchaseValue;
    error?: string;
    onRefund: () => void;
}

/**
 * One recharge in full: what was bought, what has already been returned and
 * what can still be. A refund is requested from here; the relayer settles it
 * to the wallet later, so success is a notice rather than a balance change.
 */
export const BatteryPurchaseDetailsSheetView: FC<BatteryPurchaseDetailsSheetViewProps> = ({
    isOpen,
    onClose,
    purchase,
    refunding,
    refunded,
    error,
    onRefund
}) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();

    const giftOnTheWay = isGiftOnTheWay(purchase);
    const amount = (value: string | undefined) =>
        value !== undefined ? formatBatteryAmount(value, purchase.currency) : undefined;
    const chargesAndAmount = (charges: number, paid: string | undefined) =>
        giftOnTheWay
            ? {
                  value: amount(paid) ?? t('battery_charges', { charges: formatCount(charges) }),
                  sub: undefined
              }
            : { value: t('battery_charges', { charges: formatCount(charges) }), sub: amount(paid) };

    const refill = chargesAndAmount(purchase.charges, purchase.amount);
    const returned = purchase.refunded
        ? chargesAndAmount(purchase.refunded.charges, purchase.refunded.amount)
        : undefined;
    const refundable =
        purchase.refundable && purchase.status !== 'refund_pending'
            ? chargesAndAmount(purchase.refundable.charges, purchase.refundable.amount)
            : undefined;

    return (
        <Modal isOpen={isOpen} onClose={onClose} heading={t('battery_history_details')}>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                <MultichainDetailCell
                    label={t('battery_history_type')}
                    value={t(purchaseTypeLabelKey[purchase.type])}
                />
                <MultichainDetailCell
                    label={t('battery_history_date')}
                    value={formatHistoryDateTime(language, purchase.timestamp)}
                />
                <MultichainDetailCell
                    label={t('battery_history_refill')}
                    value={refill.value}
                    sub={refill.sub}
                    last={!returned && !refundable}
                />
                {returned && (
                    <MultichainDetailCell
                        label={t('battery_history_returned')}
                        value={returned.value}
                        sub={returned.sub}
                        last={!refundable}
                    />
                )}
                {refundable && (
                    <MultichainDetailCell
                        label={t('battery_history_refundable')}
                        value={refundable.value}
                        sub={refundable.sub}
                        last
                    />
                )}
            </div>

            {refunded ? (
                <div className="flex flex-col items-center gap-4 pt-6">
                    <div className="flex items-center gap-2 text-accentGreen">
                        <IcDonemarkOutline28 className="size-7" />
                        <span className="text-label1">
                            {t('battery_history_refund_done', {
                                amount:
                                    amount(refunded.amount) ??
                                    t('battery_charges', { charges: formatCount(refunded.charges) })
                            })}
                        </span>
                    </div>
                    <p className="px-4 text-center text-body2 text-textSecondary">
                        {t('battery_history_refund_done_description')}
                    </p>
                    <Button variant="secondary" size="large" fullWidth onClick={onClose}>
                        {t('ok')}
                    </Button>
                </div>
            ) : (
                refundable && (
                    <div className="flex flex-col gap-4 pt-6">
                        <p className="px-4 text-center text-body2 text-textSecondary">
                            {t('battery_history_refund_description', {
                                charges: formatCount(purchase.refundable!.charges)
                            })}
                        </p>
                        {error && <p className="text-center text-body2 text-accentRed">{error}</p>}
                        <Button
                            variant="primaryBlue"
                            size="large"
                            fullWidth
                            loading={refunding}
                            onClick={onRefund}
                        >
                            {t('battery_history_refund_action')}
                        </Button>
                    </div>
                )
            )}
        </Modal>
    );
};

export const BatteryPurchaseDetailsSheet: FC<{
    isOpen: boolean;
    onClose: () => void;
    purchase: BatteryPurchase;
}> = ({ isOpen, onClose, purchase }) => {
    const { t } = useTranslation();
    const refund = useRequestBatteryRefund();
    const [error, setError] = useState<string | undefined>();
    const [refunded, setRefunded] = useState<BatteryPurchaseValue | undefined>();

    return (
        <BatteryPurchaseDetailsSheetView
            isOpen={isOpen}
            onClose={onClose}
            purchase={purchase}
            refunding={refund.isLoading}
            refunded={refunded}
            error={error}
            onRefund={() => {
                const requested = purchase.refundable;
                if (!requested) return;
                setError(undefined);
                refund.mutate(purchase.id, {
                    onSuccess: () => setRefunded(requested),
                    onError: e => setError(getErrorText(e, { t }))
                });
            }}
        />
    );
};
