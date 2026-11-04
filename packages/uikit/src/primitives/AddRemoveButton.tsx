import { FC } from 'react';
import { cn } from '../libs/css';

export interface AddRemoveButtonProps {
    type: 'add' | 'remove';
    onClick?: () => void;
    disabled?: boolean;
    className?: string;
}

export const AddRemoveButton: FC<AddRemoveButtonProps> = ({
    type,
    onClick,
    disabled,
    className
}) => (
    <button
        type="button"
        disabled={disabled}
        aria-label={type}
        onClick={onClick}
        className={cn(
            'flex h-[24px] w-[24px] items-center justify-center rounded-full border-0 bg-backgroundContentTint p-0 text-constantWhite',
            disabled ? 'cursor-not-allowed opacity-[0.48]' : 'cursor-pointer',
            className
        )}
    >
        <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {type === 'add' && (
                <path
                    d="M6 1V11M1 6H11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                />
            )}
            {type === 'remove' && (
                <path d="M1 6H11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            )}
        </svg>
    </button>
);
