import { FC, KeyboardEvent } from 'react';

import { cn } from '../../../../libs/css';
import { useTranslation } from '../../../../hooks/translation';
import { Button } from '../../../../primitives';

export interface BatteryPromoCodeFieldProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    loading?: boolean;
    /** Rejection message shown under the field, already localized. */
    error?: string;
}

/**
 * Single-line promo-code entry from the battery screen. While empty the
 * trailing control pastes from the clipboard; once there is text it becomes
 * the Apply action (Enter submits too). A rejected code paints the border red
 * and prints the reason below.
 */
export const BatteryPromoCodeField: FC<BatteryPromoCodeFieldProps> = ({
    value,
    onChange,
    onSubmit,
    loading,
    error
}) => {
    const { t } = useTranslation();

    const onPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) onChange(text.trim());
        } catch {
            /* clipboard unavailable / denied */
        }
    };

    const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && value.trim() && !loading) {
            e.preventDefault();
            onSubmit();
        }
    };

    return (
        <div className="flex flex-col">
            <label
                htmlFor="battery-promo-code"
                className={cn(
                    'flex h-16 cursor-text items-center gap-2 rounded-medium border-[1.5px] bg-fieldBackground pl-4 pr-4 transition-colors',
                    error
                        ? 'border-fieldErrorBorder'
                        : 'border-transparent focus-within:border-fieldActiveBorder'
                )}
            >
                <input
                    id="battery-promo-code"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={t('battery_promocode_title')}
                    spellCheck={false}
                    autoComplete="off"
                    autoCapitalize="characters"
                    disabled={loading}
                    className="min-w-0 flex-1 bg-transparent text-body1 text-textPrimary outline-none placeholder:text-textSecondary"
                />
                {value ? (
                    <Button
                        variant="primaryBlue"
                        size="small"
                        loading={loading}
                        onClick={onSubmit}
                        className="h-8 shrink-0 px-3"
                    >
                        {t('battery_promocode_apply')}
                    </Button>
                ) : (
                    <Button
                        variant="tertiary"
                        size="small"
                        onClick={onPaste}
                        className="h-8 shrink-0 px-3"
                    >
                        {t('paste')}
                    </Button>
                )}
            </label>
            {error && <p className="mt-3 px-1 text-body3 text-fieldErrorBorder">{error}</p>}
        </div>
    );
};
