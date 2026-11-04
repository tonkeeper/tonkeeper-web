import { FC } from 'react';
import IcChevronRight16 from '../../icons/components/IcChevronRight16';
import IcExclamationmarkCircle28 from '../../icons/components/IcExclamationmarkCircle28';
import IcQrCode28Color from '../../icons/components/IcQrCode28Color';
import IcRefresh16 from '../../icons/components/IcRefresh16';
import { cn } from '../../libs/css';
import { Modal } from '../../primitives/Modal';
import { Button, SkeletonScope, useIsSkeleton, useSkeletonMask } from '../../primitives';
import { useTranslation } from '../../hooks/translation';
import type { ExchangeLayoutCard } from '@tonkeeper/core/dist/onrampApi';

export interface AddFundsSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onReceive: () => void;
    /**
     * Called when a "Buy with …" card is tapped. The card's
     * `preferredCurrency` is the app's primary currency when the backend
     * supports it, else a geo-derived fiat — pass it down into
     * ChooseAsset / PaymentMethod / EnterAmount.
     */
    onBuy: (card: ExchangeLayoutCard) => void;
    /** Cards returned by `useExchangeLayout('deposit')`. */
    cards?: ExchangeLayoutCard[];
    isLoading?: boolean;
    /** The layout request failed — Receive stays usable, buy options show a retry row. */
    isError?: boolean;
    onRetry?: () => void;
}

interface RowProps {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    onClick: () => void;
}

const Row: FC<RowProps> = ({ icon, title, subtitle, onClick }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={isSkeleton}
            className={cn(
                'flex w-full items-center rounded-medium bg-backgroundContent text-left',
                'transition-colors hover:enabled:bg-backgroundContentTint focus:outline-none focus-visible:ring-2 focus-visible:ring-accentBlue',
                '[--tk-skeleton-fill:var(--tk-background-content-tint)]'
            )}
        >
            <div className="flex shrink-0 items-center py-4 pl-4">
                {isSkeleton ? (
                    <span
                        {...mask({ w: 44, h: 44, r: 'var(--tk-rounding-full)' })}
                        className="block h-11 w-11"
                    />
                ) : (
                    icon
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex items-center justify-between gap-4">
                    <p {...mask({ w: 65 })} className="truncate text-label1 text-textPrimary">
                        {title}
                    </p>
                    {isSkeleton && (
                        <span {...mask({ w: 41 })} className="shrink-0 text-label1">
                            0
                        </span>
                    )}
                </div>
                <p {...mask({ w: 170 })} className="truncate text-body2 text-textSecondary">
                    {subtitle}
                </p>
            </div>
            {!isSkeleton && (
                <div className="flex shrink-0 items-center py-4 pr-4">
                    <IcChevronRight16 className="h-4 w-4 text-textTertiary" />
                </div>
            )}
        </button>
    );
};

const ReceiveIcon: FC = () => (
    <div className="relative h-11 w-11 overflow-hidden rounded-full">
        <IcQrCode28Color className="absolute left-1/2 top-1/2 h-11 w-11 -translate-x-1/2 -translate-y-1/2 text-accentBlue" />
    </div>
);

const CardIcon: FC<{ image: string }> = ({ image }) =>
    image ? (
        <img src={image} alt="" className="h-11 w-11 rounded-full object-cover" loading="eager" />
    ) : (
        <div className="h-11 w-11 rounded-full bg-backgroundContentTint" />
    );

/**
 * Error row shown when the buy-options request failed: Receive stays fully
 * usable above it, this row explains and offers a retry, per the mockup.
 */
const LoadErrorRow: FC<{ onRetry: () => void }> = ({ onRetry }) => {
    const { t } = useTranslation();
    return (
        <div className="flex w-full items-center rounded-medium bg-backgroundContent">
            <div className="flex shrink-0 items-center py-4 pl-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-backgroundContentTint text-iconSecondary">
                    <IcExclamationmarkCircle28 className="size-7" />
                </div>
            </div>
            <div className="min-w-0 flex-1 p-4 text-label2 text-textPrimary">
                {t('add_funds_load_error')}
            </div>
            <div className="flex shrink-0 items-center py-4 pr-4">
                <Button
                    variant="tertiary"
                    size="small"
                    leftIcon={<IcRefresh16 className="size-4" />}
                    onClick={onRetry}
                >
                    {t('retry')}
                </Button>
            </div>
        </div>
    );
};

const SHEET_ROW_COUNT = 4;

export const AddFundsContent: FC<Omit<AddFundsSheetProps, 'isOpen' | 'onClose'>> = ({
    onReceive,
    onBuy,
    cards,
    isLoading,
    isError,
    onRetry
}) => {
    const { t } = useTranslation();
    const showSkeleton = Boolean(isLoading) && !cards?.length && !isError;

    return (
        <div className="flex flex-col gap-2 pb-2">
            {/* Receive doesn't depend on the buy-options request, so it stays
                outside the loading scope — masking it would disable an
                independent action for the whole load, and the error path
                already keeps it usable. */}
            <Row
                icon={<ReceiveIcon />}
                title={t('add_funds_receive_tokens')}
                subtitle={t('add_funds_receive_subtitle')}
                onClick={onReceive}
            />
            <SkeletonScope loading={showSkeleton}>
                {showSkeleton &&
                    Array.from({ length: SHEET_ROW_COUNT - 1 }, (_, index) => (
                        <Row
                            key={index}
                            icon={null}
                            title="Placeholder"
                            subtitle="Placeholder subtitle"
                            onClick={() => undefined}
                        />
                    ))}
            </SkeletonScope>
            {isError && !cards?.length && <LoadErrorRow onRetry={() => onRetry?.()} />}
            {cards?.map(card => (
                <Row
                    key={`${card.title}-${card.image}`}
                    icon={<CardIcon image={card.image} />}
                    title={card.title}
                    subtitle={card.description}
                    onClick={() => onBuy(card)}
                />
            ))}
        </div>
    );
};

export const AddFundsSheet: FC<AddFundsSheetProps> = ({
    isOpen,
    onClose,
    onReceive,
    onBuy,
    cards,
    isLoading,
    isError,
    onRetry
}) => {
    const { t } = useTranslation();
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            variant="content"
            topBarTitle={t('wallet_add_funds')}
        >
            <AddFundsContent
                onReceive={onReceive}
                onBuy={onBuy}
                cards={cards}
                isLoading={isLoading}
                isError={isError}
                onRetry={onRetry}
            />
        </Modal>
    );
};
