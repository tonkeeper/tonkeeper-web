import { FC } from 'react';

import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import IcRefresh16 from '../../../icons/components/IcRefresh16';
import IcSwitch16 from '../../../icons/components/IcSwitch16';
import { Link, Loader } from '../../../primitives';

export interface NetworkFeeValueProps {
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    /** Pre-formatted fee, rendered as "≈ value": "$0.000262", "0.005 TON", "2 charges". */
    value?: string;
    /** Rendered after the value as "· unit" — the fee currency or method name. */
    unit?: string;
    /**
     * Opens the fee-method picker. Turns the unit accent-coloured and adds
     * the switch chevron, so the row reads as a control.
     */
    onChange?: () => void;
}

/**
 * Network-fee value for a confirm row. Plain when the chain has a single fee
 * method; with `onChange` it becomes the "choose payment method" affordance
 * the native apps show when several methods are available.
 */
export const NetworkFeeValue: FC<NetworkFeeValueProps> = ({
    loading,
    error,
    onRetry,
    value,
    unit,
    onChange
}) => {
    const { t } = useTranslation();

    if (error) {
        return (
            <span className="inline-flex items-center gap-1">
                {t('send_fee_unavailable')} <span className="text-textSecondary">·</span>
                <Link
                    onClick={onRetry}
                    className="inline-flex items-center gap-1 text-label1 text-textAccent"
                >
                    {t('send_fee_retry')} <IcRefresh16 className="inline-block h-4 w-4" />
                </Link>
            </span>
        );
    }
    if (loading) return <Loader size="small" className="align-middle" />;

    // An unpriced method (the balance can't even cover the attached coins)
    // still keeps the switch, so the user can reach another method or a top-up.
    const content = !value ? (
        <>—</>
    ) : (
        <>
            ≈ {value}
            {unit && (
                <>
                    {' '}
                    <span className="text-textSecondary">·</span>{' '}
                    <span className={cn(onChange ? 'text-textAccent' : undefined)}>{unit}</span>
                </>
            )}
        </>
    );

    if (!onChange) return content;
    return (
        <button
            type="button"
            onClick={onChange}
            className="inline-flex items-center gap-1 text-label1 text-textPrimary transition-colors duration-100 hover:text-textSecondary"
        >
            <span>{content}</span>
            <IcSwitch16 className="size-4 text-textAccent" />
        </button>
    );
};
