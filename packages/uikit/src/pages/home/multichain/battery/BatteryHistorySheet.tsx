import { FC, ReactNode, useState } from 'react';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { Modal } from '../../../../primitives/Modal';
import { SkeletonScope, useIsSkeleton, useSkeletonMask } from '../../../../primitives/Skeleton';
import { ModalCenterError, ModalCenterState } from '../../../../components/shared/ModalCenterState';
import { truncateAddress } from '../../../../components/transfer/multichain/multichainSendShared';
import IcBattery28 from '../../../../icons/components/IcBattery28';
import IcClock56 from '../../../../icons/components/IcClock56';
import { BatteryPurchase, useBatteryPurchases } from '../../../../state/battery';
import { formatHistoryDateTime } from '../history/multichain-history-utils';
import { SettingsListGroup } from '../settings/SettingsList';
import { BatteryPurchaseDetailsSheet } from './BatteryPurchaseDetailsSheet';
import { formatBatteryAmount, isGiftOnTheWay, purchaseTypeLabelKey } from './battery-history-utils';
import { formatCount } from '@tonkeeper/core/dist/utils/numberFormat';

export interface BatteryHistorySheetViewProps {
    isOpen: boolean;
    onClose: () => void;
    /** `undefined` renders the loading state (or the error state when `error` is set). */
    purchases: BatteryPurchase[] | undefined;
    error?: boolean;
    onRetry: () => void;
    onSelect: (purchase: BatteryPurchase) => void;
    /** Nested sheets owned by the connected component. */
    children?: ReactNode;
}

const PLACEHOLDER_PURCHASES: BatteryPurchase[] = [0, 1, 2].map(
    (id): BatteryPurchase => ({
        id,
        type: 'crypto',
        status: 'completed',
        timestamp: 0,
        charges: 0
    })
);

/**
 * Every recharge of the battery with its refund state. Rows open the
 * purchase details, where a refundable purchase can be returned.
 */
export const BatteryHistorySheetView: FC<BatteryHistorySheetViewProps> = ({
    isOpen,
    onClose,
    purchases,
    error,
    onRetry,
    onSelect,
    children
}) => {
    const { t } = useTranslation();
    const loading = purchases === undefined;
    const rows = loading ? PLACEHOLDER_PURCHASES : purchases;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            mobileHeight="full"
            heading={t('battery_history_title')}
            subheading={t('battery_history_subtitle')}
        >
            {loading && error ? (
                <ModalCenterError icon={<IcClock56 />} onRetry={onRetry} />
            ) : rows.length === 0 ? (
                <ModalCenterState
                    icon={<IcClock56 />}
                    title={t('battery_history_empty_title')}
                    subtitle={t('battery_history_empty_subtitle')}
                />
            ) : (
                <SkeletonScope loading={loading}>
                    <SettingsListGroup>
                        {rows.map(purchase => (
                            <BatteryPurchaseRow
                                key={purchase.id}
                                purchase={purchase}
                                onClick={() => onSelect(purchase)}
                            />
                        ))}
                    </SettingsListGroup>
                </SkeletonScope>
            )}
            {children}
        </Modal>
    );
};

const BatteryPurchaseRow: FC<{ purchase: BatteryPurchase; onClick: () => void }> = ({
    purchase,
    onClick
}) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    const title =
        purchase.status === 'refund_pending'
            ? t('battery_history_refund_pending')
            : purchase.status === 'refunded'
            ? t('battery_history_refunded')
            : t('battery_history_refill');
    const source = purchase.forAccount
        ? t('battery_history_for', { address: truncateAddress(purchase.forAccount) })
        : t(purchaseTypeLabelKey[purchase.type]);
    const subtitle = `${source} · ${formatHistoryDateTime(language, purchase.timestamp)}`;

    const paid =
        purchase.amount !== undefined
            ? formatBatteryAmount(purchase.amount, purchase.currency)
            : undefined;
    const primary = isGiftOnTheWay(purchase)
        ? paid
        : t('battery_charges', { charges: formatCount(purchase.charges) });
    const secondary = isGiftOnTheWay(purchase) ? undefined : paid;
    const struck = purchase.status === 'refunded';

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSkeleton}
            className={cn(
                'flex w-full items-center gap-4 px-4 py-4 text-left [--tk-skeleton-fill:var(--tk-background-content-tint)]',
                !isSkeleton &&
                    'cursor-pointer transition-colors duration-100 hover:bg-backgroundContentTint'
            )}
        >
            <span
                {...mask({ w: 44, h: 44, r: 'var(--tk-rounding-full)' })}
                className="flex size-11 shrink-0 items-center justify-center rounded-full bg-backgroundContentTint text-iconSecondary"
            >
                {!isSkeleton && <IcBattery28 className="size-7" />}
            </span>
            <div className="min-w-0 flex-1">
                <div {...mask({ w: 65 })} className="truncate text-label1 text-textPrimary">
                    {title}
                </div>
                <div {...mask({ w: 170 })} className="truncate text-body2 text-textSecondary">
                    {subtitle}
                </div>
            </div>
            <div className="shrink-0 text-right">
                <div
                    {...mask({ w: 41 })}
                    className={cn(
                        'text-label1',
                        struck ? 'text-textSecondary line-through' : 'text-textPrimary'
                    )}
                >
                    {primary}
                </div>
                {!isSkeleton && secondary && (
                    <div className="text-body2 text-textSecondary">{secondary}</div>
                )}
            </div>
        </button>
    );
};

export const BatteryHistorySheet: FC<{ isOpen: boolean; onClose: () => void }> = ({
    isOpen,
    onClose
}) => {
    const purchases = useBatteryPurchases(isOpen);
    const [selectedId, setSelectedId] = useState<number | undefined>();
    // Resolved from the live list so a refund settling while the details are
    // open updates the sheet instead of showing the row as it was clicked.
    const selected = purchases.data?.find(purchase => purchase.id === selectedId);

    return (
        <BatteryHistorySheetView
            isOpen={isOpen}
            onClose={onClose}
            purchases={purchases.data}
            error={purchases.isError}
            onRetry={() => purchases.refetch()}
            onSelect={purchase => setSelectedId(purchase.id)}
        >
            {selected && (
                <BatteryPurchaseDetailsSheet
                    isOpen
                    onClose={() => setSelectedId(undefined)}
                    purchase={selected}
                />
            )}
        </BatteryHistorySheetView>
    );
};
