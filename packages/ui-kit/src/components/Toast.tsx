import { FC, ReactNode } from 'react';
import { cn } from '../utils/cn';
import { Loader } from './Loader';

export type ToastSize = 'small' | 'medium';

export interface ToastAction {
    label: ReactNode;
    onClick: () => void;
}

export interface ToastProps {
    text: ReactNode;
    size?: ToastSize;
    loading?: boolean;
    action?: ToastAction;
    className?: string;
}

const SIZE: Record<ToastSize, string> = {
    small: 'rounded-small px-4 py-3',
    medium: 'rounded-[24px] px-6 py-3.5'
};

const SHADOW = 'shadow-[0px_4px_8px_0px_rgba(0,0,0,0.04)]';

export const Toast: FC<ToastProps> = ({ text, size = 'small', loading, action, className }) => {
    if (action) {
        return (
            <div
                role="status"
                className={cn(
                    'box-border flex h-14 w-full items-center rounded-medium bg-backgroundContent',
                    SHADOW,
                    className
                )}
            >
                <span className="min-w-0 flex-1 truncate py-[18px] pl-5 text-body2 text-textPrimary">
                    {text}
                </span>
                <button
                    type="button"
                    onClick={action.onClick}
                    className="flex h-full shrink-0 cursor-pointer items-center justify-center whitespace-nowrap rounded-r-medium border-0 bg-transparent px-5 font-sans text-label2 text-accentRed outline-0 transition-[background-color,opacity] [-webkit-tap-highlight-color:transparent] hover:bg-backgroundContentTint active:opacity-80"
                >
                    {action.label}
                </button>
            </div>
        );
    }

    return (
        <div
            role="status"
            className={cn(
                'inline-flex max-w-[358px] items-center justify-center bg-backgroundContentTint text-center',
                SHADOW,
                loading ? 'gap-2 rounded-[24px] py-3.5 pl-4 pr-6' : SIZE[size],
                className
            )}
        >
            {loading && <Loader size="small" className="text-iconSecondary" />}
            <span className="break-words text-label2 text-textPrimary">{text}</span>
        </div>
    );
};
