import { FC } from 'react';

import { XMarkCircleIcon } from '../../Icon';
import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import IcQrViewfinderOutline28 from '../../../icons/components/IcQrViewfinderOutline28';
import { Button } from '../../../primitives';

export interface SendAddressFieldProps {
    value: string;
    onChange: (value: string) => void;
    onClear: () => void;
    onPaste: () => void;
    /** Marks the field touched so the parent can decide to show `error`. */
    onBlur?: () => void;
    /** When provided, a scan button is shown; the native shell wires it. */
    onScan?: () => void;
    /** Network-format error, already resolved to a message by the parent. */
    error?: string;
}

/**
 * Recipient-address input for the multichain send form. The whole box (padding
 * and border included) focuses the textarea — a `<label>` wraps it so a click
 * anywhere lands in the field. While empty it offers Paste (and, on the native
 * shell, Scan); once filled it offers Clear. A red border + message appear when
 * `error` is set. The textarea grows with its content (`field-sizing:content`).
 */
export const SendAddressField: FC<SendAddressFieldProps> = ({
    value,
    onChange,
    onClear,
    onPaste,
    onBlur,
    onScan,
    error
}) => {
    const { t } = useTranslation();
    return (
        <div className="flex flex-col">
            <label
                htmlFor="send-address"
                className={cn(
                    'flex min-h-16 cursor-text items-center gap-2 rounded-medium border-[1.5px] bg-fieldBackground px-4 py-3 transition-colors',
                    error
                        ? 'border-fieldErrorBorder'
                        : 'border-transparent focus-within:border-fieldActiveBorder'
                )}
            >
                <textarea
                    id="send-address"
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onBlur={onBlur}
                    placeholder={t('send_address_placeholder')}
                    rows={1}
                    spellCheck={false}
                    autoComplete="off"
                    className="min-w-0 flex-1 resize-none bg-transparent text-body1 font-medium leading-6 text-textPrimary outline-none [field-sizing:content] placeholder:text-textSecondary"
                />
                {value ? (
                    <Button
                        variant="tertiary"
                        size="small"
                        aria-label="Clear"
                        onClick={onClear}
                        leftIcon={<XMarkCircleIcon />}
                        className="size-7 shrink-0 bg-transparent p-0 text-textSecondary hover:enabled:bg-transparent hover:enabled:text-textPrimary"
                    />
                ) : (
                    <div className="flex shrink-0 items-center gap-1">
                        <Button
                            variant="tertiary"
                            size="small"
                            onClick={onPaste}
                            className="h-8 px-3"
                        >
                            {t('send_paste')}
                        </Button>
                        {onScan && (
                            <Button
                                variant="tertiary"
                                size="small"
                                aria-label={t('send_scan')}
                                onClick={onScan}
                                className="size-7 bg-transparent p-0 text-textAccent hover:enabled:bg-transparent"
                            >
                                <IcQrViewfinderOutline28 className="size-6" />
                            </Button>
                        )}
                    </div>
                )}
            </label>
            {error && <p className="mt-3 px-1 text-body3 text-fieldErrorBorder">{error}</p>}
        </div>
    );
};
