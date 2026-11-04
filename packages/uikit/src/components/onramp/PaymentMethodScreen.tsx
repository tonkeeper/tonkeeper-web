import { FC, Fragment, useMemo } from 'react';
import type {
    ExchangePaymentMethodType,
    OnrampPaymentMethod
} from '@tonkeeper/core/dist/onrampApi';
import IcChevronRight16 from '../../icons/components/IcChevronRight16';
import IcCreditcard28 from '../../icons/components/IcCreditcard28';
import IcExclamationmarkCircle28 from '../../icons/components/IcExclamationmarkCircle28';
import { Modal } from '../../primitives/Modal';
import { SkeletonScope, useIsSkeleton, useSkeletonMask } from '../../primitives';
import { useTranslation } from '../../hooks/translation';
import { ModalCenterError, ModalCenterState } from '../shared/ModalCenterState';

export interface PaymentMethodScreenProps {
    isOpen: boolean;
    onClose: () => void;
    onBack?: () => void;
    /** Asset chosen on the previous screen — used to fetch eligible methods. */
    assetId?: string;
    /** Fiat currency currently selected for this purchase. */
    fiat?: string;
    /** Payment (on-ramp) or payout (off-ramp) methods of the chosen asset. */
    methods?: OnrampPaymentMethod[];
    isLoading?: boolean;
    /** The methods request failed — shows the error state with a retry. */
    isError?: boolean;
    onRetry?: () => void;
    /** Called when the user taps a non-P2P method (continues to EnterAmount). */
    onSelect: (method: ExchangePaymentMethodType) => void;
    /** Called when the user taps the P2P Market row (branches to P2P session). */
    onSelectP2P: () => void;
    /** Called when the user taps the currency in the subtitle. */
    onChangeFiat?: () => void;
    /** Top bar copy; defaults to the on-ramp "Payment method" wording. */
    title?: string;
    subtitle?: string;
}

export type PaymentMethodContentProps = Omit<
    PaymentMethodScreenProps,
    'isOpen' | 'onClose' | 'onBack' | 'title' | 'subtitle'
>;

const filterMethods = (
    methods: OnrampPaymentMethod[],
    fiat: string | undefined
): OnrampPaymentMethod[] => {
    if (!fiat) return methods;
    return methods.filter(m => m.providers.some(p => p.fiat === fiat));
};

const MethodIcon: FC<{ image: string }> = ({ image }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    // `<img>` cannot host the mask pseudo-element, so the skeleton renders
    // its own circle instead of the (placeholder) image.
    if (isSkeleton) {
        return (
            <span
                {...mask({ w: '100%', h: '100%', r: 'var(--tk-rounding-full)' })}
                className="block h-7 w-7 shrink-0"
            />
        );
    }
    return image ? (
        <img
            src={image}
            alt=""
            className="h-7 w-7 shrink-0 rounded-full object-cover"
            loading="lazy"
        />
    ) : (
        <div className="h-7 w-7 shrink-0 rounded-full bg-backgroundContentTint" />
    );
};

const MethodRow: FC<{
    method: OnrampPaymentMethod;
    onClick: () => void;
    showDivider: boolean;
}> = ({ method, onClick, showDivider }) => {
    const isSkeleton = useIsSkeleton();
    const mask = useSkeletonMask();

    return (
        <>
            <button
                type="button"
                onClick={onClick}
                disabled={isSkeleton}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:enabled:bg-backgroundContentTint focus:outline-none focus-visible:bg-backgroundContentTint"
            >
                <MethodIcon image={method.image} />
                <span {...mask({ w: 145 })} className="text-label1 text-textPrimary">
                    {method.name}
                </span>
            </button>
            {showDivider && <div className="ml-14 h-px bg-separatorCommon" />}
        </>
    );
};

/**
 * Stand-in rows for the loading state — every visible field is masked, so the
 * values only have to exist. Distinct `type`s are not real; rows are keyed by
 * index while masked.
 */
const PLACEHOLDER_METHODS: OnrampPaymentMethod[] = Array.from({ length: 13 }, () => ({
    type: 'card' as ExchangePaymentMethodType,
    name: 'Placeholder',
    image: '',
    providers: []
}));

export const PaymentMethodTopBarTitle: FC<{
    title: string;
    subtitle: string;
    fiat?: string;
    onChangeFiat?: () => void;
}> = ({ title, subtitle, fiat, onChangeFiat }) => (
    <div className="flex flex-col items-center">
        <span className="text-label1 text-textPrimary">{title}</span>
        <div className="flex items-center gap-1 text-body3">
            <span className="text-textSecondary">{subtitle}</span>
            {fiat && (
                <button
                    type="button"
                    onClick={onChangeFiat}
                    disabled={!onChangeFiat}
                    aria-label={onChangeFiat ? `Change currency from ${fiat}` : undefined}
                    className="-mx-1 -my-0.5 inline-flex cursor-pointer items-center gap-0.5 rounded px-1 py-0.5 text-accentBlue hover:bg-backgroundContentTint hover:opacity-80 focus:outline-none focus-visible:bg-backgroundContentTint disabled:cursor-default disabled:hover:bg-transparent disabled:hover:opacity-100"
                >
                    {fiat}
                    {onChangeFiat && (
                        <IcChevronRight16
                            className="h-3 w-3 rotate-90 text-accentBlue"
                            aria-hidden
                        />
                    )}
                </button>
            )}
        </div>
    </div>
);

export const PaymentMethodContent: FC<PaymentMethodContentProps> = ({
    fiat,
    methods: available,
    isLoading,
    isError,
    onRetry,
    onSelect,
    onSelectP2P
}) => {
    const { t } = useTranslation();

    const loaded = useMemo(() => filterMethods(available ?? [], fiat), [available, fiat]);
    const showSkeleton = Boolean(isLoading) && loaded.length === 0 && !isError;
    const methods = showSkeleton ? PLACEHOLDER_METHODS : loaded;

    return (
        <div className="pb-4">
            {isError && (
                <ModalCenterError
                    icon={<IcExclamationmarkCircle28 />}
                    onRetry={() => onRetry?.()}
                />
            )}
            {!isError && !showSkeleton && methods.length === 0 && (
                <ModalCenterState
                    icon={<IcCreditcard28 />}
                    title={t('payment_method_empty_title')}
                    subtitle={t('payment_method_empty_subtitle')}
                />
            )}
            {!isError && methods.length > 0 && (
                <SkeletonScope loading={showSkeleton}>
                    <div className="overflow-hidden rounded-medium bg-backgroundContent [--tk-skeleton-fill:var(--tk-background-content-tint)]">
                        {methods.map((m, i) => (
                            <Fragment key={showSkeleton ? i : m.type}>
                                <MethodRow
                                    method={m}
                                    onClick={() =>
                                        m.type === 'p2p' ? onSelectP2P() : onSelect(m.type)
                                    }
                                    showDivider={i < methods.length - 1}
                                />
                            </Fragment>
                        ))}
                    </div>
                </SkeletonScope>
            )}
        </div>
    );
};

export const PaymentMethodScreen: FC<PaymentMethodScreenProps> = ({
    isOpen,
    onClose,
    onBack,
    title,
    subtitle,
    fiat,
    onChangeFiat,
    ...contentProps
}) => {
    const { t } = useTranslation();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onBack={onBack}
            variant="content"
            topBarTitle={
                <PaymentMethodTopBarTitle
                    title={title ?? t('payment_method_title')}
                    subtitle={subtitle ?? t('payment_method_subtitle')}
                    fiat={fiat}
                    onChangeFiat={onChangeFiat}
                />
            }
        >
            <PaymentMethodContent fiat={fiat} {...contentProps} />
        </Modal>
    );
};
