import { FC, ReactNode } from 'react';

import { cn } from '../../../libs/css';
import { useTranslation } from '../../../hooks/translation';
import { Radio } from '../../../primitives';
import { Modal } from '../../../primitives/Modal';

export interface SendFeeMethodOption<K extends string = string> {
    key: K;
    /** 44px round icon of the paying asset or the battery. */
    icon: ReactNode;
    title: string;
    /** Priced fee, e.g. "≈ $0.00154 (0.00115 TON)", or a loader while pricing. */
    subtitle?: ReactNode;
    /** The wallet can't pay with this method right now. */
    disabled?: boolean;
    /**
     * Way out of a disabled row — "Recharge" / "Add Funds". Tapping the row
     * runs it instead of selecting the method, as the native pickers do.
     */
    action?: { label: string; onClick: () => void };
}

/**
 * "Network fee → Choose method" picker of the send confirm screen: one row
 * per way of paying the fee, each priced, the current one checked. Picking a
 * row reports it and closes.
 */
export const SendFeeMethodSheet = <K extends string>({
    isOpen,
    options,
    selected,
    onSelect,
    onClose
}: {
    isOpen: boolean;
    options: SendFeeMethodOption<K>[];
    selected: K | undefined;
    onSelect: (key: K) => void;
    onClose: () => void;
}) => {
    const { t } = useTranslation();

    return (
        <Modal isOpen={isOpen} onClose={onClose} mobileHeight="auto">
            <div className="pb-4 text-center">
                <div className="px-4 pt-3 text-h2 text-textPrimary">{t('send_network_fee')}</div>
                <div className="px-4 pt-1 text-body1 text-textSecondary">
                    {t('send_fee_choose_method')}
                </div>
            </div>
            <div className="overflow-hidden rounded-medium bg-backgroundContent">
                {options.map((option, index) => (
                    <div key={option.key}>
                        {index > 0 && <div className="ml-4 h-[0.5px] bg-separatorCommon" />}
                        <button
                            type="button"
                            disabled={option.disabled && !option.action}
                            onClick={() => {
                                if (option.disabled) {
                                    option.action?.onClick();
                                } else {
                                    onSelect(option.key);
                                }
                                onClose();
                            }}
                            className={cn(
                                'flex w-full items-center gap-4 p-4 text-left transition-colors duration-100 hover:bg-backgroundContentTint',
                                option.disabled && !option.action && 'hover:bg-transparent'
                            )}
                        >
                            <div
                                className={cn(
                                    'flex min-w-0 flex-1 items-center gap-4',
                                    option.disabled && 'opacity-50'
                                )}
                            >
                                <div className="size-11 shrink-0">{option.icon}</div>
                                <div className="min-w-0 flex-1">
                                    <div className="truncate text-label1 text-textPrimary">
                                        {option.title}
                                    </div>
                                    {option.subtitle !== undefined && (
                                        <div className="flex h-5 items-center truncate text-body2 text-textSecondary">
                                            {option.subtitle}
                                        </div>
                                    )}
                                </div>
                            </div>
                            {option.disabled && option.action ? (
                                <span className="shrink-0 text-label1 text-textAccent">
                                    {option.action.label}
                                </span>
                            ) : (
                                <Radio checked={option.key === selected} variant="check" />
                            )}
                        </button>
                    </div>
                ))}
            </div>
        </Modal>
    );
};

/** The battery's picker icon: a flash on a tinted green disc. */
export const FeeMethodBatteryIcon: FC<{ children: ReactNode }> = ({ children }) => (
    <div className="flex size-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--tk-accent-green)_12%,transparent)] text-accentGreen [&>svg]:h-7 [&>svg]:w-auto">
        {children}
    </div>
);
