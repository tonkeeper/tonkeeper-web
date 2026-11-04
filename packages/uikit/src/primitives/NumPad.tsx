import { FC, ReactNode } from 'react';
import { useTranslation } from '../hooks/translation';
import IcDelete36 from '../icons/components/IcDelete36';
import { cn } from '../libs/css';

const KEY_CLASS =
    'flex h-[72px] flex-1 select-none items-center justify-center rounded-medium transition-colors duration-100 [-webkit-tap-highlight-color:transparent] hover:bg-backgroundContent active:bg-backgroundContent disabled:pointer-events-none';

const DIGIT_ROWS = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
];

/**
 * Numeric keypad of the passcode screens: three columns of 72px keys, with
 * the bottom row holding an optional extra key (biometry), 0 and backspace.
 * Backspace is hidden, keeping its slot, while `canDelete` is false.
 */
export const NumPad: FC<{
    onDigit: (digit: string) => void;
    onDelete: () => void;
    canDelete: boolean;
    disabled?: boolean;
    /** Bottom-left key, e.g. a biometry button; the slot stays empty without one. */
    extraKey?: ReactNode;
    className?: string;
}> = ({ onDigit, onDelete, canDelete, disabled, extraKey, className }) => {
    const { t } = useTranslation();

    const digitKey = (digit: string) => (
        <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => onDigit(digit)}
            className={cn(KEY_CLASS, 'text-num2 text-textPrimary')}
        >
            {digit}
        </button>
    );

    return (
        <div className={cn('flex flex-col p-4', className)}>
            {DIGIT_ROWS.map(row => (
                <div key={row[0]} className="flex">
                    {row.map(digitKey)}
                </div>
            ))}
            <div className="flex">
                <div className="flex flex-1 items-center justify-center">{extraKey}</div>
                {digitKey('0')}
                <button
                    type="button"
                    aria-label={t('delete')}
                    disabled={disabled || !canDelete}
                    onClick={onDelete}
                    className={cn(KEY_CLASS, 'text-iconPrimary', !canDelete && 'opacity-0')}
                >
                    <IcDelete36 className="size-9" />
                </button>
            </div>
        </div>
    );
};
